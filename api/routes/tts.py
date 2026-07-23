"""OpenRouter text-to-speech proxy for AssistMe Voice Mode.

POST /api/tts           → raw audio (mp3/pcm) from OpenRouter /api/v1/audio/speech
GET  /api/tts/health    → availability + default model/voice
GET  /api/tts/voices    → documented default voices for the configured model
"""

from __future__ import annotations

import logging
import os
import re
from typing import Optional

import httpx
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import Response
from pydantic import BaseModel, Field

from api.config import (
    check_rate_limit,
    get_client_ip,
    get_openrouter_api_key,
    get_site_title,
    get_site_url,
)

router = APIRouter()
logger = logging.getLogger(__name__)

OPENROUTER_SPEECH_URL = "https://openrouter.ai/api/v1/audio/speech"
DEFAULT_TTS_MODEL = "x-ai/grok-voice-tts-1.0"
DEFAULT_TTS_VOICE = "eve"
DEFAULT_TTS_FORMAT = "mp3"
MAX_TTS_CHARS = 2000

_MARKDOWN_RE = re.compile(r"[*_`#>\|]+")
_URL_RE = re.compile(r"https?://\S+", re.I)
_MULTI_SPACE_RE = re.compile(r"\s+")

_DEFAULT_VOICES = ("eve", "ara", "rex", "sal", "leo", "sage")


def get_tts_model() -> str:
    return os.getenv("OPENROUTER_TTS_MODEL", DEFAULT_TTS_MODEL).strip() or DEFAULT_TTS_MODEL


def get_tts_voice() -> str:
    return os.getenv("OPENROUTER_TTS_VOICE", DEFAULT_TTS_VOICE).strip() or DEFAULT_TTS_VOICE


def is_tts_configured() -> bool:
    return bool(get_openrouter_api_key())


def normalize_for_tts(text: str) -> str:
    """Strip markdown/URLs so neural TTS does not read formatting aloud."""
    if not text:
        return ""
    cleaned = text.replace("**", "").replace("__", "").replace("`", "")
    cleaned = _URL_RE.sub("link", cleaned)
    cleaned = re.sub(r"!\[([^\]]*)\]\([^)]+\)", r"\1", cleaned)
    cleaned = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", cleaned)
    cleaned = _MARKDOWN_RE.sub("", cleaned)
    cleaned = re.sub(r"^[-*•]\s+", "", cleaned, flags=re.M)
    cleaned = _MULTI_SPACE_RE.sub(" ", cleaned)
    return cleaned.strip()[:MAX_TTS_CHARS]


class TTSRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=MAX_TTS_CHARS)
    voice: Optional[str] = None
    model: Optional[str] = None
    response_format: Optional[str] = Field(default=DEFAULT_TTS_FORMAT, pattern="^(mp3|pcm)$")
    speed: Optional[float] = Field(default=1.0, ge=0.5, le=2.0)


def _enforce_tts_rate_limit(request: Request) -> None:
    client_ip = get_client_ip(request)
    if not check_rate_limit(f"tts:{client_ip}"):
        raise HTTPException(status_code=429, detail="TTS rate limit exceeded. Please try again later.")


@router.get("/api/tts/health")
@router.get("/api/tts/status")
async def tts_health():
    available = is_tts_configured()
    return {
        "success": True,
        "available": available,
        "provider": "openrouter",
        "mode": "modular-stt-llm-tts",
        "model": get_tts_model() if available else None,
        "voice": get_tts_voice() if available else None,
        "message": (
            "OpenRouter TTS ready for AssistMe Voice Mode."
            if available
            else "Set OPENROUTER_API_KEY to enable neural Voice Mode TTS."
        ),
    }


@router.get("/api/tts/voices")
async def tts_voices():
    return {
        "success": True,
        "model": get_tts_model(),
        "default": get_tts_voice(),
        "voices": list(_DEFAULT_VOICES),
        "note": "Public POST /api/tts ignores client model/voice and uses OPENROUTER_TTS_* env defaults.",
    }


@router.post("/api/tts")
@router.post("/api/tts/synthesize")
async def synthesize(req: TTSRequest, request: Request):
    _enforce_tts_rate_limit(request)

    api_key = get_openrouter_api_key()
    if not api_key:
        raise HTTPException(
            status_code=503,
            detail={
                "success": False,
                "available": False,
                "error": "OPENROUTER_API_KEY is not configured",
                "fallback": "browser-speechSynthesis",
            },
        )

    input_text = normalize_for_tts(req.text)
    if not input_text:
        raise HTTPException(status_code=400, detail="Text is empty after normalization")

    # Public surface: always use server-configured model/voice (ignore client overrides).
    model = get_tts_model()
    voice = get_tts_voice()
    response_format = (req.response_format or DEFAULT_TTS_FORMAT).strip().lower()
    if response_format not in ("mp3", "pcm"):
        response_format = DEFAULT_TTS_FORMAT

    payload = {
        "model": model,
        "input": input_text,
        "voice": voice,
        "response_format": response_format,
        "speed": req.speed if req.speed is not None else 1.0,
    }

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": get_site_url(),
        "X-Title": get_site_title(),
    }

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            upstream = await client.post(OPENROUTER_SPEECH_URL, headers=headers, json=payload)
    except httpx.TimeoutException as exc:
        logger.warning("OpenRouter TTS timeout: %s", exc)
        raise HTTPException(status_code=504, detail="TTS request timed out") from exc
    except httpx.HTTPError as exc:
        logger.warning("OpenRouter TTS transport error: %s", exc)
        raise HTTPException(status_code=502, detail="TTS upstream unavailable") from exc

    if upstream.status_code >= 400:
        detail = upstream.text[:500]
        logger.warning("OpenRouter TTS error %s: %s", upstream.status_code, detail)
        status = 402 if upstream.status_code == 402 else 502
        raise HTTPException(
            status_code=status,
            detail={
                "success": False,
                "error": f"OpenRouter TTS failed ({upstream.status_code})",
                "upstream": detail,
                "fallback": "browser-speechSynthesis",
            },
        )

    media_type = "audio/mpeg" if response_format == "mp3" else "audio/pcm"
    content_type = upstream.headers.get("content-type") or media_type
    generation_id = upstream.headers.get("x-generation-id", "")

    return Response(
        content=upstream.content,
        media_type=content_type,
        headers={
            "Cache-Control": "no-store",
            "X-TTS-Provider": "openrouter",
            "X-TTS-Model": model,
            "X-TTS-Voice": voice,
            "X-Generation-Id": generation_id,
        },
    )

"""Speech compatibility endpoints; free-only mode uses device read-aloud."""

from __future__ import annotations

import logging
import os
import re
from typing import Optional

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

from api.config import (
    check_rate_limit,
    get_client_ip,
)

router = APIRouter()
logger = logging.getLogger(__name__)

OPENROUTER_SPEECH_URL = "https://openrouter.ai/api/v1/audio/speech"
DEFAULT_TTS_MODEL = "x-ai/grok-voice-tts-1.0"
DEFAULT_TTS_VOICE = "eve"
DEFAULT_TTS_FORMAT = "mp3"
MAX_TTS_CHARS = 2000

_MARKDOWN_RE = re.compile(r"[*_`#>\|]+")
_URL_RE = re.compile(r"https?://[^\s)]+", re.I)
_MULTI_SPACE_RE = re.compile(r"\s+")

_DEFAULT_VOICES = ("eve", "ara", "rex", "sal", "leo", "sage")


def get_tts_model() -> str:
    return os.getenv("OPENROUTER_TTS_MODEL", DEFAULT_TTS_MODEL).strip() or DEFAULT_TTS_MODEL


def get_tts_voice() -> str:
    return os.getenv("OPENROUTER_TTS_VOICE", DEFAULT_TTS_VOICE).strip() or DEFAULT_TTS_VOICE


def is_tts_configured() -> bool:
    # Hosted voice generation is paid; retain browser speech synthesis.
    return False


def normalize_for_tts(text: str) -> str:
    """Strip markdown/URLs so neural TTS does not read formatting aloud."""
    if not text:
        return ""
    cleaned = text.replace("**", "").replace("__", "").replace("`", "")
    cleaned = _URL_RE.sub("link", cleaned)
    cleaned = _strip_markdown_links(cleaned)
    cleaned = _MARKDOWN_RE.sub("", cleaned)
    cleaned = re.sub(r"^[-*•]\s+", "", cleaned, flags=re.M)
    cleaned = _MULTI_SPACE_RE.sub(" ", cleaned)
    return cleaned.strip()[:MAX_TTS_CHARS]


def _strip_markdown_links(value: str) -> str:
    """Keep link labels and discard destinations in a single linear scan."""
    output: list[str] = []
    label: list[str] = []
    index = 0
    state = "text"
    image = False
    while index < len(value):
        char = value[index]
        if state == "text":
            if char == "!" and index + 1 < len(value) and value[index + 1] == "[":
                image = True
                label = []
                state = "label"
                index += 2
                continue
            if char == "[":
                image = False
                label = []
                state = "label"
                index += 1
                continue
            output.append(char)
            index += 1
            continue

        if state == "label":
            if char == "]" and index + 1 < len(value) and value[index + 1] == "(":
                state = "destination"
                index += 2
                continue
            label.append(char)
            index += 1
            continue

        if state == "destination":
            if char == ")":
                output.extend(label)
                label = []
                state = "text"
                image = False
            index += 1

    if state == "label":
        output.append("![" if image else "[")
        output.extend(label)
    elif state == "destination":
        output.extend(label)
    return "".join(output)


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
            else "Hosted speech is disabled by the free-only policy; use device read-aloud."
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

    raise HTTPException(status_code=503, detail={"success": False, "error": "Hosted speech is disabled by the free-only policy. Use device read-aloud.", "fallback": "browser-speechSynthesis"})

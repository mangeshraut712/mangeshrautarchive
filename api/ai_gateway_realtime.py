import os
from typing import Any
from urllib.parse import quote

import httpx

GATEWAY_REALTIME_SUBPROTOCOL = "ai-gateway-realtime.v1"
GATEWAY_AUTH_SUBPROTOCOL_PREFIX = "ai-gateway-auth."
DEFAULT_GATEWAY_BASE_URL = "https://ai-gateway.vercel.sh/v4/ai"
DEFAULT_GATEWAY_API_BASE = "https://ai-gateway.vercel.sh"
DEFAULT_REALTIME_MODEL = "openai/gpt-realtime-2"
CLIENT_SECRETS_PATH = "/v1/realtime/client-secrets"


def get_ai_gateway_api_key() -> str:
    return (
        os.getenv("AI_GATEWAY_API_KEY", "").strip()
        or os.getenv("VERCEL_AI_GATEWAY_API_KEY", "").strip()
    )


def get_realtime_model() -> str:
    return os.getenv("AI_GATEWAY_REALTIME_MODEL", DEFAULT_REALTIME_MODEL).strip()


def get_gateway_base_url() -> str:
    return os.getenv("AI_GATEWAY_BASE_URL", DEFAULT_GATEWAY_BASE_URL).strip().rstrip("/")


def is_realtime_configured() -> bool:
    return bool(get_ai_gateway_api_key())


def build_gateway_realtime_url(model_id: str | None = None) -> str:
    model = model_id or get_realtime_model()
    base = get_gateway_base_url()
    ws_base = base.replace("https://", "wss://").replace("http://", "ws://")
    return f"{ws_base}/realtime-model?ai-model-id={quote(model, safe='/')}"


def build_gateway_realtime_protocols(token: str) -> list[str]:
    return [GATEWAY_REALTIME_SUBPROTOCOL, f"{GATEWAY_AUTH_SUBPROTOCOL_PREFIX}{token}"]


def build_realtime_session_instructions() -> str:
    return (
        "You are AssistMe, the voice assistant for Mangesh Raut's portfolio website. "
        "Answer briefly and conversationally in English. Focus on Mangesh's experience, "
        "skills, projects, education, and how to contact him. If asked something outside "
        "the portfolio, politely steer back to Mangesh's work."
    )


def build_realtime_session_config() -> dict[str, Any]:
    return {
        "instructions": build_realtime_session_instructions(),
        "voice": os.getenv("AI_GATEWAY_REALTIME_VOICE", "alloy"),
        "turn_detection": {"type": "server_vad"},
        "input_audio_transcription": {},
    }


async def mint_gateway_realtime_client_secret(
    model_id: str | None = None,
    session: dict[str, Any] | None = None,
) -> str:
    api_key = get_ai_gateway_api_key()
    if not api_key:
        raise RuntimeError("AI Gateway realtime is not configured.")

    model = model_id or get_realtime_model()
    payload: dict[str, Any] = {"model": model}
    if session:
        payload["session"] = session

    api_base = os.getenv("AI_GATEWAY_API_BASE", DEFAULT_GATEWAY_API_BASE).strip().rstrip("/")
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(
            f"{api_base}{CLIENT_SECRETS_PATH}",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json=payload,
        )
        response.raise_for_status()
        data = response.json()

    token = str(data.get("token", "")).strip()
    if not token:
        raise RuntimeError("AI Gateway did not return a realtime client secret.")
    return token

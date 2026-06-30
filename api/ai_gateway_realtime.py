import os
from urllib.parse import quote

GATEWAY_REALTIME_SUBPROTOCOL = "ai-gateway-realtime.v1"
GATEWAY_AUTH_SUBPROTOCOL_PREFIX = "ai-gateway-auth."
DEFAULT_GATEWAY_BASE_URL = "https://ai-gateway.vercel.sh/v4/ai"
DEFAULT_REALTIME_MODEL = "openai/gpt-realtime-2"


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

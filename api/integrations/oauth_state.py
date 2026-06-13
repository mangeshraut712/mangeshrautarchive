import base64
import hashlib
import hmac
import os
import time


def _is_production_runtime() -> bool:
    return os.getenv("VERCEL_ENV") == "production"


def integration_signing_material() -> str:
    return (
        os.getenv("INTEGRATION_ENCRYPTION_KEY", "").strip()
        or os.getenv("INTEGRATION_SYNC_ADMIN_TOKEN", "").strip()
        or os.getenv("MONITOR_ADMIN_TOKEN", "").strip()
    )


def integration_signing_configured() -> bool:
    return bool(integration_signing_material())


def _signing_key() -> bytes:
    material = integration_signing_material()
    if not material:
        if _is_production_runtime():
            raise RuntimeError(
                "Integration signing secret is not configured. "
                "Set INTEGRATION_ENCRYPTION_KEY or INTEGRATION_SYNC_ADMIN_TOKEN."
            )
        material = "local-dev-integration-signing"
    return hashlib.sha256(material.encode("utf-8")).digest()


def _encode_signed_payload(purpose: str, provider: str, ttl_seconds: int) -> str:
    expires = int(time.time()) + ttl_seconds
    payload = f"{purpose}:{provider}:{expires}"
    signature = hmac.new(_signing_key(), payload.encode("utf-8"), hashlib.sha256).hexdigest()
    raw = f"{payload}:{signature}".encode("utf-8")
    return base64.urlsafe_b64encode(raw).decode("utf-8").rstrip("=")


def _verify_signed_payload(token: str, purpose: str, provider: str) -> bool:
    if not token:
        return False
    try:
        padded = token + "=" * (-len(token) % 4)
        decoded = base64.urlsafe_b64decode(padded.encode("utf-8")).decode("utf-8")
        payload, signature = decoded.rsplit(":", 1)
        expected = hmac.new(_signing_key(), payload.encode("utf-8"), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(signature, expected):
            return False
        token_purpose, token_provider, expires_raw = payload.split(":", 2)
        if token_purpose != purpose or token_provider != provider:
            return False
        return int(expires_raw) >= int(time.time())
    except (ValueError, TypeError, RuntimeError):
        return False


def create_oauth_state(provider: str, ttl_seconds: int = 900) -> str:
    return _encode_signed_payload("oauth", provider, ttl_seconds)


def verify_oauth_state(state: str, provider: str) -> bool:
    return _verify_signed_payload(state, "oauth", provider)


def create_connect_auth_token(provider: str, ttl_seconds: int = 600) -> str:
    return _encode_signed_payload("connect", provider, ttl_seconds)


def verify_connect_auth_token(token: str, provider: str) -> bool:
    return _verify_signed_payload(token, "connect", provider)

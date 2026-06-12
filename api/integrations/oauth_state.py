import base64
import hashlib
import hmac
import os
import time


def _signing_key() -> bytes:
    material = (
        os.getenv("INTEGRATION_SYNC_ADMIN_TOKEN", "").strip()
        or os.getenv("INTEGRATION_ENCRYPTION_KEY", "").strip()
        or "integration-state"
    )
    return hashlib.sha256(material.encode("utf-8")).digest()


def create_oauth_state(provider: str, ttl_seconds: int = 900) -> str:
    expires = int(time.time()) + ttl_seconds
    payload = f"{provider}:{expires}"
    signature = hmac.new(_signing_key(), payload.encode("utf-8"), hashlib.sha256).hexdigest()
    raw = f"{payload}:{signature}".encode("utf-8")
    return base64.urlsafe_b64encode(raw).decode("utf-8").rstrip("=")


def verify_oauth_state(state: str, provider: str) -> bool:
    if not state:
        return False
    try:
        padded = state + "=" * (-len(state) % 4)
        decoded = base64.urlsafe_b64decode(padded.encode("utf-8")).decode("utf-8")
        payload, signature = decoded.rsplit(":", 1)
        expected = hmac.new(_signing_key(), payload.encode("utf-8"), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(signature, expected):
            return False
        state_provider, expires_raw = payload.split(":", 1)
        if state_provider != provider:
            return False
        return int(expires_raw) >= int(time.time())
    except (ValueError, TypeError):
        return False

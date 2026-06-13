import os
from typing import Optional

from fastapi import HTTPException, Request

from api.integrations.oauth_state import verify_connect_auth_token


PROVIDER_SLUGS = {
    "google_calendar": "google-calendar",
    "google-calendar": "google_calendar",
    "whoop": "whoop",
    "withings": "withings",
}


def normalize_provider(provider: str) -> str:
    normalized = provider.strip().replace("-", "_")
    if normalized not in {"google_calendar", "whoop", "withings"}:
        raise HTTPException(status_code=404, detail="Unknown integration provider.")
    return normalized


def provider_connect_path(provider: str) -> str:
    normalized = normalize_provider(provider)
    slug = PROVIDER_SLUGS[normalized]
    return f"/api/integrations/{slug}/connect"


def integration_admin_token() -> str:
    return (
        os.getenv("INTEGRATION_SYNC_ADMIN_TOKEN", "").strip()
        or os.getenv("MONITOR_ADMIN_TOKEN", "").strip()
    )


def is_production_runtime() -> bool:
    return os.getenv("VERCEL_ENV") == "production"


def require_integration_admin(request: Request) -> None:
    expected = integration_admin_token()
    if not expected:
        raise HTTPException(
            status_code=503,
            detail="Integration sync admin token is not configured.",
        )

    provided = request.headers.get("x-integration-admin-token", "").strip()
    if not hmac_compare(provided, expected):
        raise HTTPException(status_code=403, detail="Integration admin token required")


def hmac_compare(left: str, right: str) -> bool:
    import hmac

    return hmac.compare_digest(left, right)


def verify_oauth_connect_access(
    request: Request,
    provider: str,
    auth: Optional[str] = None,
) -> None:
    normalized = normalize_provider(provider)
    provided_admin = request.headers.get("x-integration-admin-token", "").strip()
    expected_admin = integration_admin_token()
    if expected_admin and hmac_compare(provided_admin, expected_admin):
        return

    token = (auth or request.query_params.get("auth") or "").strip()
    if verify_connect_auth_token(token, normalized):
        return

    if not is_production_runtime() and not expected_admin:
        return

    raise HTTPException(
        status_code=403,
        detail="Integration connect requires a signed owner auth token or admin header.",
    )

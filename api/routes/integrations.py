import os
from datetime import datetime, timezone
from typing import Any, Dict

from fastapi import APIRouter, HTTPException, Request

from api.integrations.supabase_store import (
    empty_health_summary,
    fetch_latest_health_summary,
    supabase_is_configured,
)

router = APIRouter()


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _env_present(name: str) -> bool:
    return bool(os.getenv(name, "").strip())


def _oauth_ready(*names: str) -> bool:
    return all(_env_present(name) for name in names)


def _provider_status() -> Dict[str, Dict[str, Any]]:
    return {
        "supabase": {
            "configured": supabase_is_configured(),
            "purpose": "Encrypted token vault and sanitized health/calendar summaries.",
            "nextStep": "Set SUPABASE_URL and a server-side Supabase key in Vercel.",
        },
        "whoop": {
            "configured": _oauth_ready("WHOOP_CLIENT_ID", "WHOOP_CLIENT_SECRET"),
            "purpose": "Sleep, recovery, strain, resting heart rate, and HRV trends.",
            "scopes": [
                "read:recovery",
                "read:cycles",
                "read:sleep",
                "read:body_measurement",
                "offline",
            ],
            "nextStep": "Create a WHOOP OAuth app and configure callback URL.",
        },
        "withings": {
            "configured": _oauth_ready("WITHINGS_CLIENT_ID", "WITHINGS_CLIENT_SECRET"),
            "purpose": "Weight and body composition trends from Withings devices.",
            "scopes": ["user.metrics", "user.activity"],
            "nextStep": "Create a Withings OAuth app and configure callback URL.",
        },
        "googleCalendar": {
            "configured": _oauth_ready(
                "GOOGLE_CALENDAR_CLIENT_ID",
                "GOOGLE_CALENDAR_CLIENT_SECRET",
            ),
            "purpose": "Free/busy availability, reminders, and safe calendar summaries.",
            "scopes": ["calendar.freebusy", "calendar.readonly"],
            "nextStep": "Create a Google OAuth client and start with free/busy scope.",
        },
    }


def _require_integration_admin(request: Request) -> None:
    expected = (
        os.getenv("INTEGRATION_SYNC_ADMIN_TOKEN", "").strip()
        or os.getenv("MONITOR_ADMIN_TOKEN", "").strip()
    )
    if not expected:
        raise HTTPException(
            status_code=503,
            detail="Integration sync admin token is not configured.",
        )

    provided = request.headers.get("x-integration-admin-token", "").strip()
    if provided != expected:
        raise HTTPException(status_code=403, detail="Integration admin token required")


@router.get(
    "/api/integrations/status",
    tags=["core"],
    summary="Safe integration readiness status",
)
async def get_integrations_status():
    return {
        "success": True,
        "timestamp": _utc_now(),
        "providers": _provider_status(),
        "privacy": {
            "publicPayloads": "Only sanitized summaries should be exposed to the portfolio UI.",
            "tokenStorage": "OAuth tokens must stay server-side and encrypted before provider sync is enabled.",
        },
    }


@router.get(
    "/api/health-vitals/summary",
    tags=["core"],
    summary="Public sanitized health vitals summary",
)
async def get_health_vitals_summary():
    summary = await fetch_latest_health_summary()
    return {
        "success": True,
        "timestamp": _utc_now(),
        "status": summary.get("status", "unknown"),
        "source": summary.get("source", "fallback"),
        "data": summary.get("data") or empty_health_summary(),
        "message": summary.get("message"),
        "privacy": "Public health payload is deliberately limited to daily summary metrics and trends.",
    }


@router.post(
    "/api/health-vitals/sync",
    tags=["core"],
    summary="Protected health vitals sync contract",
)
async def sync_health_vitals(request: Request):
    _require_integration_admin(request)
    raise HTTPException(
        status_code=501,
        detail=(
            "Provider sync is not implemented yet. Configure Supabase token storage "
            "and OAuth apps before enabling WHOOP or Withings sync."
        ),
    )


@router.get(
    "/api/calendar/availability",
    tags=["core"],
    summary="Public calendar availability contract",
)
async def get_calendar_availability():
    provider = _provider_status()["googleCalendar"]
    return {
        "success": True,
        "timestamp": _utc_now(),
        "status": "not_configured" if not provider["configured"] else "pending_sync",
        "source": "google-calendar" if provider["configured"] else "fallback",
        "days": [],
        "message": (
            "Google Calendar OAuth is configured but free/busy sync is not implemented yet."
            if provider["configured"]
            else "Google Calendar OAuth is not configured yet."
        ),
        "privacy": "Availability should expose free/busy windows only, not private event details.",
    }

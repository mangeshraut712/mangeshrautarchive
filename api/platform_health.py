"""Aggregate platform API health checks for the system monitor."""

import os
from datetime import datetime, timezone
from typing import Any, Dict, List

from api.integrations import google_calendar
from api.integrations.supabase_store import (
    fetch_latest_health_summary,
    integration_is_connected,
    supabase_is_configured,
)

INTEGRATION_ENV_KEYS = (
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "INTEGRATION_SYNC_ADMIN_TOKEN",
    "INTEGRATION_ENCRYPTION_KEY",
    "GOOGLE_CALENDAR_CLIENT_ID",
    "GOOGLE_CALENDAR_CLIENT_SECRET",
    "WHOOP_CLIENT_ID",
    "WHOOP_CLIENT_SECRET",
    "WITHINGS_CLIENT_ID",
    "WITHINGS_CLIENT_SECRET",
)


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _env_present(name: str) -> bool:
    return bool(os.getenv(name, "").strip())


def _status_from_flags(*, ok: bool, warn: bool = False) -> str:
    if ok:
        return "healthy"
    if warn:
        return "degraded"
    return "unhealthy"


def integration_env_presence() -> Dict[str, bool]:
    return {key.lower(): _env_present(key) for key in INTEGRATION_ENV_KEYS}


async def collect_platform_health() -> Dict[str, Any]:
    checks: List[Dict[str, Any]] = []

    checks.append(
        {
            "id": "core_health",
            "label": "API Health",
            "path": "/api/health",
            "status": "healthy",
            "detail": "Backend process responding",
        }
    )

    supabase_ok = supabase_is_configured()
    checks.append(
        {
            "id": "supabase_vault",
            "label": "Supabase Vault",
            "path": "/api/integrations/status",
            "status": _status_from_flags(ok=supabase_ok),
            "detail": "Configured" if supabase_ok else "Missing SUPABASE_URL or service key",
        }
    )

    provider_configured = {
        "googleCalendar": google_calendar.is_configured(),
        "whoop": _env_present("WHOOP_CLIENT_ID") and _env_present("WHOOP_CLIENT_SECRET"),
        "withings": _env_present("WITHINGS_CLIENT_ID") and _env_present("WITHINGS_CLIENT_SECRET"),
    }
    provider_connected = {
        "googleCalendar": await integration_is_connected("google_calendar"),
        "whoop": await integration_is_connected("whoop"),
        "withings": await integration_is_connected("withings"),
    }

    for key, label, path in (
        ("googleCalendar", "Google Calendar", "/api/calendar/availability"),
        ("whoop", "WHOOP", "/api/health-vitals/summary"),
        ("withings", "Withings", "/api/health-vitals/summary"),
    ):
        configured = provider_configured[key]
        connected = provider_connected[key]
        if not configured:
            status = "unhealthy"
            detail = "OAuth env not configured"
        elif not connected:
            status = "degraded"
            detail = "Configured but not connected"
        else:
            status = "healthy"
            detail = "Connected"
        checks.append(
            {
                "id": f"integration_{key.lower()}",
                "label": label,
                "path": path,
                "status": status,
                "detail": detail,
                "configured": configured,
                "connected": connected,
            }
        )

    health_summary = await fetch_latest_health_summary()
    health_status = str(health_summary.get("status") or "unknown")
    checks.append(
        {
            "id": "health_vitals_summary",
            "label": "Health Vitals Summary",
            "path": "/api/health-vitals/summary",
            "status": _status_from_flags(
                ok=health_status == "live",
                warn=health_status in ("empty", "degraded"),
            ),
            "detail": f"source={health_summary.get('source')} status={health_status}",
        }
    )

    if provider_connected["googleCalendar"]:
        calendar_status = "healthy"
        calendar_detail = "Calendar connected"
    elif provider_configured["googleCalendar"]:
        calendar_status = "degraded"
        calendar_detail = "needs_auth"
    else:
        calendar_status = "unhealthy"
        calendar_detail = "not_configured"

    checks.append(
        {
            "id": "calendar_availability",
            "label": "Calendar Availability",
            "path": "/api/calendar/availability",
            "status": calendar_status,
            "detail": calendar_detail,
        }
    )

    summary = {
        "healthy": len([entry for entry in checks if entry["status"] == "healthy"]),
        "degraded": len([entry for entry in checks if entry["status"] == "degraded"]),
        "unhealthy": len([entry for entry in checks if entry["status"] == "unhealthy"]),
        "total": len(checks),
    }

    return {
        "success": True,
        "timestamp": _utc_now(),
        "environment": os.getenv("VERCEL_ENV", "local"),
        "checks": checks,
        "summary": summary,
        "integration_env": integration_env_presence(),
    }

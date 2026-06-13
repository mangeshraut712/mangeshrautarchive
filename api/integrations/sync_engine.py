import os
import secrets
from datetime import datetime, timezone
from typing import Any, Dict, List

from api.integrations import google_calendar, whoop, withings
from api.integrations.token_manager import get_valid_access_token
from api.integrations.supabase_store import (
    integration_is_connected,
    update_sync_state,
    upsert_health_summary_row,
)


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


async def sync_whoop_health() -> Dict[str, Any]:
    if not await integration_is_connected("whoop"):
        return {"provider": "whoop", "status": "not_connected"}
    token = await get_valid_access_token("whoop")
    if not token:
        return {"provider": "whoop", "status": "degraded", "message": "Missing WHOOP token"}
    summary = await whoop.fetch_sanitized_summary(token)
    saved = await upsert_health_summary_row(summary)
    await update_sync_state(
        "whoop",
        last_success_at=_utc_now() if saved else None,
        last_error=None if saved else "upsert_failed",
    )
    return {
        "provider": "whoop",
        "status": "live" if saved else "degraded",
        "date": summary.get("date"),
    }


async def sync_withings_health() -> Dict[str, Any]:
    if not await integration_is_connected("withings"):
        return {"provider": "withings", "status": "not_connected"}
    token = await get_valid_access_token("withings")
    if not token:
        return {"provider": "withings", "status": "degraded", "message": "Missing Withings token"}
    summary = await withings.fetch_sanitized_summary(token)
    existing = summary.copy()
    saved = await upsert_health_summary_row(existing)
    await update_sync_state(
        "withings",
        last_success_at=_utc_now() if saved else None,
        last_error=None if saved else "upsert_failed",
    )
    return {
        "provider": "withings",
        "status": "live" if saved else "degraded",
        "date": summary.get("date"),
    }


async def sync_google_calendar_availability(days: int = 7) -> Dict[str, Any]:
    if not await integration_is_connected("google_calendar"):
        return {"provider": "google_calendar", "status": "not_connected"}
    token = await get_valid_access_token("google_calendar")
    if not token:
        return {"provider": "google_calendar", "status": "degraded", "message": "Missing Google token"}
    try:
        availability = await google_calendar.fetch_availability(token, days=days)
        await update_sync_state("google_calendar", last_success_at=_utc_now(), last_error=None)
        return {
            "provider": "google_calendar",
            "status": "live",
            "daysSynced": len(availability),
        }
    except Exception:
        await update_sync_state("google_calendar", last_error="freebusy_fetch_failed")
        return {"provider": "google_calendar", "status": "degraded"}


async def register_google_calendar_watch() -> Dict[str, Any]:
    if not await integration_is_connected("google_calendar"):
        return {"provider": "google_calendar", "status": "not_connected"}
    token = await get_valid_access_token("google_calendar")
    if not token:
        return {"provider": "google_calendar", "status": "degraded"}
    webhook_base = os.getenv("GOOGLE_CALENDAR_WEBHOOK_URL", "").strip() or "https://mangeshraut.pro/api/calendar/webhook/google"
    channel_id = secrets.token_urlsafe(16)
    channel_token = secrets.token_urlsafe(32)
    try:
        watch = await google_calendar.register_watch(token, webhook_base, channel_id, channel_token)
        await update_sync_state(
            "google_calendar",
            channel_id=watch.get("id") or channel_id,
            channel_token=channel_token,
            resource_id=watch.get("resourceId"),
            channel_expires_at=watch.get("expiration"),
            last_success_at=_utc_now(),
            last_error=None,
        )
        return {
            "provider": "google_calendar",
            "status": "live",
            "channelId": watch.get("id") or channel_id,
            "resourceId": watch.get("resourceId"),
        }
    except Exception:
        await update_sync_state("google_calendar", last_error="watch_register_failed")
        return {"provider": "google_calendar", "status": "degraded"}


async def sync_all_providers() -> Dict[str, Any]:
    results: List[Dict[str, Any]] = []
    if await integration_is_connected("whoop"):
        results.append(await sync_whoop_health())
    if await integration_is_connected("withings"):
        results.append(await sync_withings_health())
    if await integration_is_connected("google_calendar"):
        results.append(await sync_google_calendar_availability())
    return {"success": True, "timestamp": _utc_now(), "results": results}

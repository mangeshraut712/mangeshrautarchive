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


def _google_watch_expiration(value: Any) -> str | None:
    if value is None:
        return None
    try:
        millis = int(str(value).strip())
        if millis <= 0:
            return None
        return datetime.fromtimestamp(millis / 1000, tz=timezone.utc).isoformat().replace("+00:00", "Z")
    except (TypeError, ValueError):
        return None


def _merge_health_fields(target: Dict[str, Any], source: Dict[str, Any]) -> None:
    for key in (
        "sleep_score",
        "recovery_score",
        "strain",
        "resting_heart_rate",
        "hrv_trend",
        "weight_trend",
        "source_status",
    ):
        value = source.get(key)
        if value is not None:
            target[key] = value


async def sync_connected_health_providers() -> Dict[str, Any]:
    today = datetime.now(timezone.utc).date().isoformat()
    merged: Dict[str, Any] = {
        "date": today,
        "sleep_score": None,
        "recovery_score": None,
        "strain": None,
        "resting_heart_rate": None,
        "hrv_trend": None,
        "weight_trend": None,
        "source_status": "synced",
    }
    results: List[Dict[str, Any]] = []

    if await integration_is_connected("whoop"):
        token = await get_valid_access_token("whoop")
        if not token:
            results.append(
                {"provider": "whoop", "status": "degraded", "message": "Missing WHOOP token"}
            )
            await update_sync_state("whoop", last_error="missing_token")
        else:
            summary = await whoop.fetch_sanitized_summary(token)
            _merge_health_fields(merged, summary)
            has_metrics = any(
                summary.get(key) is not None
                for key in ("sleep_score", "recovery_score", "strain", "resting_heart_rate")
            )
            results.append(
                {
                    "provider": "whoop",
                    "status": "live" if has_metrics else "degraded",
                    "date": summary.get("date"),
                    "metrics": {
                        key: summary.get(key)
                        for key in ("sleep_score", "recovery_score", "strain", "resting_heart_rate")
                        if summary.get(key) is not None
                    },
                }
            )
            await update_sync_state(
                "whoop",
                last_success_at=_utc_now(),
                last_error=None if has_metrics else "no_scored_metrics",
            )

    if await integration_is_connected("withings"):
        token = await get_valid_access_token("withings")
        if not token:
            results.append(
                {"provider": "withings", "status": "degraded", "message": "Missing Withings token"}
            )
            await update_sync_state("withings", last_error="missing_token")
        else:
            summary = await withings.fetch_sanitized_summary(token)
            _merge_health_fields(merged, summary)
            results.append(
                {
                    "provider": "withings",
                    "status": "live",
                    "date": summary.get("date"),
                    "metrics": {"weight_trend": summary.get("weight_trend")}
                    if summary.get("weight_trend")
                    else {},
                }
            )
            await update_sync_state(
                "withings",
                last_success_at=_utc_now(),
                last_error=None if summary.get("weight_trend") else "no_weight_metrics",
            )

    if not results:
        return {"results": [], "saved": False, "summary": merged}

    saved = await upsert_health_summary_row(merged)
    if not saved:
        for item in results:
            provider = item.get("provider")
            if provider:
                await update_sync_state(provider, last_error="upsert_failed")

    return {"results": results, "saved": saved, "summary": merged}


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
            channel_expires_at=_google_watch_expiration(watch.get("expiration")),
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
    health_payload = await sync_connected_health_providers()
    results.extend(health_payload.get("results") or [])
    if await integration_is_connected("google_calendar"):
        results.append(await sync_google_calendar_availability())
    return {
        "success": True,
        "timestamp": _utc_now(),
        "results": results,
        "healthSaved": health_payload.get("saved"),
    }

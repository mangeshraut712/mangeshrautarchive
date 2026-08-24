import os
import secrets
from datetime import datetime, timezone
from typing import Any, Dict, List

from api.integrations import apple_calendar, google_calendar, microsoft_calendar, whoop, withings
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
        "date",
    ):
        value = source.get(key)
        if value is not None:
            target[key] = value


def _whoop_has_metrics(summary: Dict[str, Any]) -> bool:
    return any(
        summary.get(key) is not None
        for key in ("sleep_score", "recovery_score", "strain", "resting_heart_rate")
    )


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
    whoop_ok = False
    withings_ok = False

    if await integration_is_connected("whoop"):
        token = await get_valid_access_token("whoop")
        if not token:
            results.append(
                {
                    "provider": "whoop",
                    "status": "degraded",
                    "message": "WHOOP token refresh deferred; keepalive cron will retry before asking for reauth.",
                }
            )
            await update_sync_state("whoop", last_error="token_refresh_deferred")
            merged["source_status"] = "partial"
        else:
            summary = await whoop.fetch_sanitized_summary(token)
            has_metrics = _whoop_has_metrics(summary)
            errors = list(summary.get("errors") or [])
            auth_failed = summary.get("source_status") == "needs_reauth" or any(
                err in {"whoop_unauthorized", "whoop_forbidden"} for err in errors
            )
            # Access can still look unexpired after a lost refresh rotation — force once.
            if auth_failed and not has_metrics:
                retry_token = await get_valid_access_token("whoop", force_refresh=True)
                if retry_token and retry_token != token:
                    summary = await whoop.fetch_sanitized_summary(retry_token)
                    has_metrics = _whoop_has_metrics(summary)
                    errors = list(summary.get("errors") or [])
                    auth_failed = summary.get("source_status") == "needs_reauth" or any(
                        err in {"whoop_unauthorized", "whoop_forbidden"} for err in errors
                    )
                elif not retry_token:
                    auth_failed = True
            if has_metrics:
                _merge_health_fields(merged, summary)
                whoop_ok = True
                results.append(
                    {
                        "provider": "whoop",
                        "status": "live",
                        "date": summary.get("date"),
                        "metrics": {
                            key: summary.get(key)
                            for key in ("sleep_score", "recovery_score", "strain", "resting_heart_rate")
                            if summary.get(key) is not None
                        },
                    }
                )
                await update_sync_state("whoop", last_success_at=_utc_now(), last_error=None)
            else:
                status = "needs_reauth" if auth_failed else "degraded"
                message = (
                    "WHOOP authorization invalid. Reconnect once via edge OAuth "
                    "(Worker callback) — hourly keepalive will keep the grant alive after that."
                    if auth_failed
                    else "WHOOP returned no scored metrics."
                )
                results.append(
                    {
                        "provider": "whoop",
                        "status": status,
                        "date": summary.get("date"),
                        "metrics": {},
                        "message": message,
                        "errors": errors,
                    }
                )
                await update_sync_state(
                    "whoop",
                    last_error="needs_reauth" if auth_failed else "no_scored_metrics",
                )
                merged["source_status"] = "partial"

    if await integration_is_connected("withings"):
        token = await get_valid_access_token("withings")
        if not token:
            results.append(
                {
                    "provider": "withings",
                    "status": "needs_reauth",
                    "message": "Withings token expired and refresh failed. Reconnect Withings OAuth.",
                }
            )
            await update_sync_state("withings", last_error="token_refresh_failed")
            merged["source_status"] = "partial"
        else:
            summary = await withings.fetch_sanitized_summary(token)
            weight = summary.get("weight_trend")
            if weight:
                _merge_health_fields(merged, summary)
                withings_ok = True
                results.append(
                    {
                        "provider": "withings",
                        "status": "live",
                        "date": summary.get("date"),
                        "metrics": {"weight_trend": weight},
                    }
                )
                await update_sync_state("withings", last_success_at=_utc_now(), last_error=None)
            else:
                results.append(
                    {
                        "provider": "withings",
                        "status": "degraded",
                        "date": summary.get("date"),
                        "metrics": {},
                        "message": "Withings returned no weight metrics.",
                    }
                )
                await update_sync_state("withings", last_error="no_weight_metrics")
                merged["source_status"] = "partial"

    if whoop_ok and withings_ok:
        merged["source_status"] = "synced"
    elif whoop_ok or withings_ok:
        merged["source_status"] = "partial"

    if not results:
        return {"results": [], "saved": False, "summary": merged}

    # Only persist when at least one provider contributed metrics; avoid bumping
    # last_synced_at on pure auth failures that would leave stale WHOOP scores looking fresh.
    should_save = whoop_ok or withings_ok
    saved = False
    if should_save:
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


async def sync_microsoft_calendar_availability(days: int = 7) -> Dict[str, Any]:
    if not await integration_is_connected("microsoft_calendar"):
        return {"provider": "microsoft_calendar", "status": "not_connected"}
    token = await get_valid_access_token("microsoft_calendar")
    if not token:
        return {"provider": "microsoft_calendar", "status": "degraded", "message": "Missing Microsoft token"}
    try:
        availability = await microsoft_calendar.fetch_availability(token, days=days)
        await update_sync_state("microsoft_calendar", last_success_at=_utc_now(), last_error=None)
        return {
            "provider": "microsoft_calendar",
            "status": "live",
            "daysSynced": len(availability),
        }
    except Exception:
        await update_sync_state("microsoft_calendar", last_error="freebusy_fetch_failed")
        return {"provider": "microsoft_calendar", "status": "degraded"}


async def sync_apple_calendar_availability(days: int = 7) -> Dict[str, Any]:
    if not await integration_is_connected("apple_calendar"):
        return {"provider": "apple_calendar", "status": "not_connected"}
    token = await get_valid_access_token("apple_calendar")
    if not token:
        return {"provider": "apple_calendar", "status": "degraded", "message": "Missing Apple token"}
    try:
        availability = await apple_calendar.fetch_availability(token, days=days)
        await update_sync_state("apple_calendar", last_success_at=_utc_now(), last_error=None)
        return {
            "provider": "apple_calendar",
            "status": "live",
            "daysSynced": len(availability),
        }
    except Exception:
        await update_sync_state("apple_calendar", last_error="freebusy_fetch_failed")
        return {"provider": "apple_calendar", "status": "degraded"}


def merge_multi_calendar_availability(*calendar_days_lists: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Merge free/busy day lists from multiple providers into a unified busy interval list."""
    day_map: Dict[str, Dict[str, Any]] = {}
    for days_list in calendar_days_lists:
        if not days_list:
            continue
        for day in days_list:
            date_key = day.get("date")
            if not date_key:
                continue
            if date_key not in day_map:
                day_map[date_key] = {
                    "date": date_key,
                    "busy": [],
                    "start": day.get("start"),
                    "end": day.get("end"),
                }
            for busy in day.get("busy") or []:
                day_map[date_key]["busy"].append(busy)

    # Sort days chronologically
    sorted_days = [day_map[k] for k in sorted(day_map.keys())]
    return sorted_days


async def sync_all_providers() -> Dict[str, Any]:
    results: List[Dict[str, Any]] = []
    health_payload = await sync_connected_health_providers()
    results.extend(health_payload.get("results") or [])
    if await integration_is_connected("google_calendar"):
        results.append(await sync_google_calendar_availability())
    if await integration_is_connected("microsoft_calendar"):
        results.append(await sync_microsoft_calendar_availability())
    if await integration_is_connected("apple_calendar"):
        results.append(await sync_apple_calendar_availability())
    return {
        "success": True,
        "timestamp": _utc_now(),
        "results": results,
        "healthSaved": health_payload.get("saved"),
    }


def _get_signing_secret() -> str:
    return (
        os.getenv("INTEGRATION_ENCRYPTION_KEY", "").strip()
        or os.getenv("INTEGRATION_SYNC_ADMIN_TOKEN", "").strip()
        or os.getenv("SESSION_AUTH_SECRET", "portfolio-calendar-fallback-secret-2026").strip()
    )


def sign_slot_token(slot: Dict[str, Any], ttl_seconds: int = 1800) -> str:
    import base64
    import hashlib
    import hmac
    import json

    secret = _get_signing_secret()
    exp = int(datetime.now(timezone.utc).timestamp()) + ttl_seconds
    payload = {
        "kind": "calendar-slot",
        "start": slot["start"],
        "end": slot["end"],
        "exp": exp,
    }
    raw = json.dumps(payload, separators=(",", ":")).encode("utf-8")
    b64_payload = base64.urlsafe_b64encode(raw).decode("utf-8").rstrip("=")
    sig = hmac.new(secret.encode("utf-8"), b64_payload.encode("utf-8"), hashlib.sha256).hexdigest()
    return f"{b64_payload}.{sig}"


def verify_slot_token(token: str) -> Dict[str, Any] | None:
    import base64
    import hashlib
    import hmac
    import json

    try:
        parts = token.split(".")
        if len(parts) != 2:
            return None
        b64_payload, supplied_sig = parts
        secret = _get_signing_secret()
        expected_sig = hmac.new(secret.encode("utf-8"), b64_payload.encode("utf-8"), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(supplied_sig, expected_sig):
            return None
        padded = b64_payload + "=" * ((4 - len(b64_payload) % 4) % 4)
        raw = base64.urlsafe_b64decode(padded.encode("utf-8"))
        payload = json.loads(raw.decode("utf-8"))
        if payload.get("kind") != "calendar-slot":
            return None
        if payload.get("exp", 0) < int(datetime.now(timezone.utc).timestamp()):
            return None
        return payload
    except Exception:
        return None


def generate_available_slots(
    now: datetime | None = None,
    busy_intervals: List[Dict[str, Any]] | None = None,
    days: int = 14,
    max_slots: int = 24,
) -> List[Dict[str, Any]]:
    from datetime import timedelta
    from zoneinfo import ZoneInfo

    eastern_tz = ZoneInfo("America/New_York")
    if now is None:
        now = datetime.now(timezone.utc)
    if busy_intervals is None:
        busy_intervals = []

    parsed_busy = []
    for b in busy_intervals:
        s_str = str(b.get("start") or "")
        e_str = str(b.get("end") or "")
        try:
            s_dt = datetime.fromisoformat(s_str.replace("Z", "+00:00"))
            e_dt = datetime.fromisoformat(e_str.replace("Z", "+00:00"))
            parsed_busy.append((s_dt.timestamp(), e_dt.timestamp()))
        except Exception:
            continue

    min_lead_seconds = 24 * 3600
    earliest_time = now.timestamp() + min_lead_seconds

    now_et = now.astimezone(eastern_tz)
    start_date_et = now_et.date()

    slots: List[Dict[str, Any]] = []
    for day_offset in range(max(1, min(days, 14))):
        current_date_et = start_date_et + timedelta(days=day_offset)
        if current_date_et.weekday() >= 5:  # Skip Saturday and Sunday
            continue

        for hour in range(10, 16):  # 10:00 AM to 4:00 PM ET
            for minute in (0, 30):
                slot_start_et = datetime(
                    current_date_et.year,
                    current_date_et.month,
                    current_date_et.day,
                    hour,
                    minute,
                    tzinfo=eastern_tz,
                )
                slot_start_utc = slot_start_et.astimezone(timezone.utc)
                slot_end_utc = slot_start_utc + timedelta(minutes=30)

                s_ts = slot_start_utc.timestamp()
                e_ts = slot_end_utc.timestamp()

                if s_ts < earliest_time:
                    continue

                overlaps = any(s_ts < b_end and e_ts > b_start for b_start, b_end in parsed_busy)
                if overlaps:
                    continue

                start_iso = slot_start_utc.strftime("%Y-%m-%dT%H:%M:%S.000Z")
                end_iso = slot_end_utc.strftime("%Y-%m-%dT%H:%M:%S.000Z")
                slot_dict = {
                    "start": start_iso,
                    "end": end_iso,
                    "timeZone": "America/New_York",
                }
                slot_dict["token"] = sign_slot_token(slot_dict)
                slots.append(slot_dict)
                if len(slots) >= max_slots:
                    return slots

    return slots

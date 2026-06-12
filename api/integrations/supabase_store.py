import os
from datetime import datetime, timezone
from typing import Any, Dict, Optional

import httpx


PUBLIC_HEALTH_FIELDS = (
    "date",
    "sleep_score",
    "recovery_score",
    "strain",
    "resting_heart_rate",
    "hrv_trend",
    "weight_trend",
    "last_synced_at",
    "source_status",
)


def _supabase_url() -> str:
    return os.getenv("SUPABASE_URL", "").strip().rstrip("/")


def _supabase_key() -> str:
    return (
        os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()
        or os.getenv("SUPABASE_ANON_KEY", "").strip()
    )


def supabase_is_configured() -> bool:
    return bool(_supabase_url() and _supabase_key())


def _table_name() -> str:
    return os.getenv("SUPABASE_HEALTH_TABLE", "health_vitals_daily").strip()


def _safe_number(value: Any) -> Optional[float]:
    if value is None:
        return None
    try:
        return round(float(value), 1)
    except (TypeError, ValueError):
        return None


def _safe_int(value: Any) -> Optional[int]:
    number = _safe_number(value)
    if number is None:
        return None
    return int(round(number))


def _safe_text(value: Any, max_chars: int = 32) -> Optional[str]:
    if not isinstance(value, str):
        return None
    cleaned = value.strip()
    return cleaned[:max_chars] if cleaned else None


def empty_health_summary() -> Dict[str, Any]:
    return {
        "date": None,
        "sleepScore": None,
        "recoveryScore": None,
        "strain": None,
        "restingHeartRate": None,
        "hrvTrend": None,
        "weightTrend": None,
        "lastSyncedAt": None,
        "sourceStatus": "not_configured",
    }


def sanitize_health_summary(row: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "date": _safe_text(row.get("date"), max_chars=16),
        "sleepScore": _safe_int(row.get("sleep_score")),
        "recoveryScore": _safe_int(row.get("recovery_score")),
        "strain": _safe_number(row.get("strain")),
        "restingHeartRate": _safe_int(row.get("resting_heart_rate")),
        "hrvTrend": _safe_text(row.get("hrv_trend")),
        "weightTrend": _safe_text(row.get("weight_trend")),
        "lastSyncedAt": _safe_text(row.get("last_synced_at"), max_chars=40),
        "sourceStatus": _safe_text(row.get("source_status")) or "synced",
    }


async def fetch_latest_health_summary() -> Dict[str, Any]:
    if not supabase_is_configured():
        return {
            "status": "not_configured",
            "source": "fallback",
            "data": empty_health_summary(),
        }

    table = _table_name()
    if not table:
        return {
            "status": "not_configured",
            "source": "fallback",
            "data": empty_health_summary(),
        }

    url = f"{_supabase_url()}/rest/v1/{table}"
    headers = {
        "apikey": _supabase_key(),
        "Authorization": f"Bearer {_supabase_key()}",
        "Accept": "application/json",
    }
    params = {
        "select": ",".join(PUBLIC_HEALTH_FIELDS),
        "order": "date.desc",
        "limit": "1",
    }

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            response = await client.get(url, headers=headers, params=params)
        response.raise_for_status()
        rows = response.json()
    except (httpx.HTTPError, ValueError):
        return {
            "status": "degraded",
            "source": "supabase",
            "data": empty_health_summary(),
            "message": "Health summary storage is configured but unavailable.",
        }

    if not isinstance(rows, list) or not rows:
        return {
            "status": "empty",
            "source": "supabase",
            "data": empty_health_summary(),
            "message": "Health summary storage is configured but has no public rows.",
        }

    return {
        "status": "live",
        "source": "supabase",
        "data": sanitize_health_summary(rows[0] if isinstance(rows[0], dict) else {}),
        "fetchedAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
    }

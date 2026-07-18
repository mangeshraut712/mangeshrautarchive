import os
import asyncio
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional
from urllib.parse import urlencode

import httpx

PROVIDER = "whoop"
AUTH_URL = "https://api.prod.whoop.com/oauth/oauth2/auth"
TOKEN_URL = "https://api.prod.whoop.com/oauth/oauth2/token"
API_BASE = "https://api.prod.whoop.com/developer/v2"
SCOPES = (
    "offline",
    "read:recovery",
    "read:cycles",
    "read:sleep",
    "read:body_measurement",
)


def _client_id() -> str:
    return os.getenv("WHOOP_CLIENT_ID", "").strip()


def _client_secret() -> str:
    return os.getenv("WHOOP_CLIENT_SECRET", "").strip()


def _redirect_uri() -> str:
    # Permanent edge callback — Vercel host is often DEPLOYMENT_DISABLED; never use
    # ephemeral Cloudflare tunnels (they caused repeated reauth failures).
    return (
        os.getenv("WHOOP_REDIRECT_URI", "").strip()
        or "https://assistme-chat.mangeshraut712.workers.dev/api/integrations/whoop/callback"
    )


def is_configured() -> bool:
    return bool(_client_id() and _client_secret())


def build_authorize_url(state: str) -> str:
    params = {
        "response_type": "code",
        "client_id": _client_id(),
        "redirect_uri": _redirect_uri(),
        "scope": " ".join(SCOPES),
        "state": state,
    }
    return f"{AUTH_URL}?{urlencode(params)}"


async def exchange_code(code: str) -> Dict[str, Any]:
    payload = {
        "grant_type": "authorization_code",
        "code": code,
        "client_id": _client_id(),
        "client_secret": _client_secret(),
        "redirect_uri": _redirect_uri(),
    }
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.post(TOKEN_URL, data=payload)
    response.raise_for_status()
    return response.json()


async def refresh_access_token(refresh_token: str) -> Dict[str, Any]:
    # WHOOP refresh docs require scope=offline (not the full authorize scope list).
    payload = {
        "grant_type": "refresh_token",
        "refresh_token": refresh_token,
        "client_id": _client_id(),
        "client_secret": _client_secret(),
        "scope": "offline",
    }
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.post(
            TOKEN_URL,
            data=payload,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
    response.raise_for_status()
    return response.json()


def _recent_query(limit: int = 10, days: int = 4) -> str:
    end = datetime.now(timezone.utc)
    start = end - timedelta(days=days)
    params = {
        "limit": str(limit),
        "start": start.strftime("%Y-%m-%dT%H:%M:%S.000Z"),
        "end": end.strftime("%Y-%m-%dT%H:%M:%S.000Z"),
    }
    return f"?{urlencode(params)}"


def _record_sort_key(record: Dict[str, Any]) -> str:
    for key in ("updated_at", "created_at", "start", "end"):
        value = record.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
    return ""


def _pick_scored_record(
    records: List[Dict[str, Any]],
    *,
    prefer_non_nap: bool = False,
) -> Optional[Dict[str, Any]]:
    ordered = sorted(records or [], key=_record_sort_key, reverse=True)
    candidates = ordered
    if prefer_non_nap:
        non_naps = [record for record in ordered if not record.get("nap")]
        if non_naps:
            candidates = non_naps
    for record in candidates:
        score = record.get("score") or {}
        if record.get("score_state") == "SCORED" and score:
            return record
    for record in candidates:
        if record.get("score"):
            return record
    return None


def _pick_active_cycle_record(records: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    ordered = sorted(records or [], key=_record_sort_key, reverse=True)
    today = datetime.now(timezone.utc).date().isoformat()

    for record in ordered:
        if record.get("end"):
            continue
        score = record.get("score") or {}
        if score.get("strain") is not None:
            return record

    for record in ordered:
        start = str(record.get("start") or "")
        if start.startswith(today):
            score = record.get("score") or {}
            if score.get("strain") is not None:
                return record

    for record in ordered:
        score = record.get("score") or {}
        if score.get("strain") is not None:
            return record

    return _pick_scored_record(records)


async def _get_json(access_token: str, path: str) -> Dict[str, Any]:
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(
            f"{API_BASE}{path}",
            headers={"Authorization": f"Bearer {access_token}"},
        )
    response.raise_for_status()
    return response.json()


def _record_date(record: Optional[Dict[str, Any]]) -> Optional[str]:
    if not record:
        return None
    for key in ("end", "start", "updated_at", "created_at"):
        value = record.get(key)
        if isinstance(value, str) and len(value) >= 10:
            return value[:10]
    return None


def _http_error_detail(exc: BaseException) -> str:
    if isinstance(exc, httpx.HTTPStatusError):
        status = exc.response.status_code
        if status == 401:
            return "whoop_unauthorized"
        if status == 403:
            return "whoop_forbidden"
        return f"whoop_http_{status}"
    if isinstance(exc, httpx.HTTPError):
        return "whoop_http_error"
    return "whoop_fetch_error"


async def fetch_sanitized_summary(access_token: str) -> Dict[str, Any]:
    today = datetime.now(timezone.utc).date().isoformat()
    query = _recent_query()
    summary: Dict[str, Any] = {
        "date": today,
        "sleep_score": None,
        "recovery_score": None,
        "strain": None,
        "resting_heart_rate": None,
        "hrv_trend": None,
        "weight_trend": None,
        "source_status": "synced",
        "errors": [],
    }
    partial = False
    auth_failed = False
    record_dates: List[str] = []

    recovery_result, cycles_result, sleep_result = await asyncio.gather(
        _get_json(access_token, f"/recovery{query}"),
        _get_json(access_token, f"/cycle{query}"),
        _get_json(access_token, f"/activity/sleep{query}"),
        return_exceptions=True,
    )

    try:
        if isinstance(recovery_result, BaseException):
            raise recovery_result
        recovery = recovery_result if isinstance(recovery_result, dict) else {}
        record = _pick_scored_record(recovery.get("records") or [])
        if record:
            record_date = _record_date(record)
            if record_date:
                record_dates.append(record_date)
            score = record.get("score") or {}
            summary["recovery_score"] = score.get("recovery_score")
            summary["resting_heart_rate"] = score.get("resting_heart_rate")
            hrv = score.get("hrv_rmssd_milli")
            if isinstance(hrv, (int, float)):
                summary["hrv_trend"] = "stable" if hrv >= 50 else "low"
        elif recovery.get("records"):
            partial = True
    except Exception as exc:
        partial = True
        detail = _http_error_detail(exc)
        summary["errors"].append(detail)
        if detail in {"whoop_unauthorized", "whoop_forbidden"}:
            auth_failed = True

    try:
        if isinstance(cycles_result, BaseException):
            raise cycles_result
        cycles = cycles_result if isinstance(cycles_result, dict) else {}
        record = _pick_active_cycle_record(cycles.get("records") or [])
        if record:
            record_date = _record_date(record)
            if record_date:
                record_dates.append(record_date)
            strain = (record.get("score") or {}).get("strain")
            if strain is not None:
                summary["strain"] = round(float(strain), 1)
        elif cycles.get("records"):
            partial = True
    except Exception as exc:
        partial = True
        detail = _http_error_detail(exc)
        summary["errors"].append(detail)
        if detail in {"whoop_unauthorized", "whoop_forbidden"}:
            auth_failed = True

    try:
        if isinstance(sleep_result, BaseException):
            raise sleep_result
        sleep = sleep_result if isinstance(sleep_result, dict) else {}
        record = _pick_scored_record(sleep.get("records") or [], prefer_non_nap=True)
        if record:
            record_date = _record_date(record)
            if record_date:
                record_dates.append(record_date)
            performance = (record.get("score") or {}).get("sleep_performance_percentage")
            if performance is not None:
                summary["sleep_score"] = int(round(float(performance)))
        elif sleep.get("records"):
            partial = True
    except Exception as exc:
        partial = True
        detail = _http_error_detail(exc)
        summary["errors"].append(detail)
        if detail in {"whoop_unauthorized", "whoop_forbidden"}:
            auth_failed = True

    has_metrics = any(
        summary.get(key) is not None
        for key in ("sleep_score", "recovery_score", "strain", "resting_heart_rate", "hrv_trend")
    )
    if auth_failed and not has_metrics:
        summary["source_status"] = "needs_reauth"
    elif partial and not has_metrics:
        summary["source_status"] = "partial"

    if record_dates:
        summary["date"] = max(record_dates)

    return summary

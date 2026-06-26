import os
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import httpx

from api.integrations.token_crypto import decrypt_secret, encrypt_secret


_local_sync_state: Dict[str, Dict[str, Any]] = {}


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


def _headers(extra: Optional[Dict[str, str]] = None) -> Dict[str, str]:
    headers = {
        "apikey": _supabase_key(),
        "Authorization": f"Bearer {_supabase_key()}",
        "Accept": "application/json",
    }
    if extra:
        headers.update(extra)
    return headers


async def _rest_request(method: str, path: str, **kwargs) -> httpx.Response:
    url = f"{_supabase_url()}/rest/v1/{path.lstrip('/')}"
    async with httpx.AsyncClient(timeout=8.0) as client:
        response = await client.request(method, url, headers=_headers(kwargs.pop("headers", None)), **kwargs)
    return response


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
        "weightTrend": _safe_text(row.get("weight_trend"), max_chars=80),
        "lastSyncedAt": _safe_text(row.get("last_synced_at"), max_chars=40),
        "sourceStatus": _safe_text(row.get("source_status")) or "synced",
    }


def _health_summary_has_metrics(data: Dict[str, Any]) -> bool:
    return any(
        data.get(key) is not None
        for key in (
            "sleepScore",
            "recoveryScore",
            "strain",
            "restingHeartRate",
            "hrvTrend",
            "weightTrend",
        )
    )


def _resolve_health_summary_status(data: Dict[str, Any]) -> str:
    source_status = data.get("sourceStatus")
    if source_status == "partial" and not _health_summary_has_metrics(data):
        return "partial"
    if source_status in {"not_configured", "partial"} and not _health_summary_has_metrics(data):
        return source_status
    return "live"


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
    headers = _headers()
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

    row_data = rows[0] if isinstance(rows[0], dict) else {}
    data = sanitize_health_summary(row_data)
    return {
        "status": _resolve_health_summary_status(data),
        "source": "supabase",
        "data": data,
        "fetchedAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
    }


async def integration_is_connected(provider: str) -> bool:
    if not supabase_is_configured():
        return False
    try:
        response = await _rest_request(
            "GET",
            "integration_accounts",
            params={
                "select": "id,status",
                "provider": f"eq.{provider}",
                "status": "eq.connected",
                "limit": "1",
            },
        )
        response.raise_for_status()
        rows = response.json()
        return isinstance(rows, list) and bool(rows)
    except (httpx.HTTPError, ValueError):
        return False


async def get_provider_access_token(provider: str) -> Optional[str]:
    from api.integrations.token_manager import get_valid_access_token

    return await get_valid_access_token(provider)


async def get_provider_token_bundle(provider: str) -> Optional[Dict[str, Any]]:
    if not supabase_is_configured():
        return None
    try:
        account_resp = await _rest_request(
            "GET",
            "integration_accounts",
            params={
                "select": "id,provider_subject,scopes,status",
                "provider": f"eq.{provider}",
                "limit": "1",
            },
        )
        account_resp.raise_for_status()
        accounts = account_resp.json()
        if not isinstance(accounts, list) or not accounts:
            return None
        account = accounts[0]
        if account.get("status") != "connected":
            return None
        account_id = account.get("id")
        if not account_id:
            return None

        token_resp = await _rest_request(
            "GET",
            "integration_tokens",
            params={
                "select": "encrypted_access_token,encrypted_refresh_token,expires_at",
                "account_id": f"eq.{account_id}",
                "limit": "1",
            },
        )
        token_resp.raise_for_status()
        tokens = token_resp.json()
        if not isinstance(tokens, list) or not tokens:
            return None
        token_row = tokens[0]
        access_enc = token_row.get("encrypted_access_token")
        refresh_enc = token_row.get("encrypted_refresh_token")
        return {
            "account_id": account_id,
            "provider_subject": account.get("provider_subject"),
            "scopes": account.get("scopes") or [],
            "access_token": decrypt_secret(access_enc) if access_enc else None,
            "refresh_token": decrypt_secret(refresh_enc) if refresh_enc else None,
            "expires_at": token_row.get("expires_at"),
        }
    except (httpx.HTTPError, ValueError, KeyError):
        return None


async def disconnect_provider(provider: str) -> bool:
    if not supabase_is_configured():
        return False
    now = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    try:
        lookup = await _rest_request(
            "GET",
            "integration_accounts",
            params={"select": "id", "provider": f"eq.{provider}", "limit": "1"},
        )
        lookup.raise_for_status()
        rows = lookup.json()
        if not isinstance(rows, list) or not rows:
            return False
        account_id = rows[0]["id"]
        await _rest_request(
            "PATCH",
            "integration_accounts",
            params={"id": f"eq.{account_id}"},
            headers={"Content-Type": "application/json"},
            json={"status": "disconnected", "updated_at": now},
        )
        await _rest_request(
            "DELETE",
            "integration_tokens",
            params={"account_id": f"eq.{account_id}"},
        )
        await update_sync_state(provider, last_error=None, cursor=None, channel_id=None, resource_id=None)
        return True
    except (httpx.HTTPError, ValueError, KeyError):
        return False


async def save_provider_tokens(
    provider: str,
    *,
    provider_subject: str,
    scopes: List[str],
    access_token: str,
    refresh_token: Optional[str] = None,
    expires_at: Optional[str] = None,
) -> bool:
    if not supabase_is_configured():
        return False

    now = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    account_payload = {
        "provider": provider,
        "provider_subject": provider_subject,
        "status": "connected",
        "scopes": scopes,
        "last_synced_at": now,
        "updated_at": now,
    }

    try:
        lookup = await _rest_request(
            "GET",
            "integration_accounts",
            params={
                "select": "id",
                "provider": f"eq.{provider}",
                "limit": "1",
            },
        )
        lookup.raise_for_status()
        rows = lookup.json()
        if isinstance(rows, list) and rows:
            account_id = rows[0]["id"]
            patch_resp = await _rest_request(
                "PATCH",
                "integration_accounts",
                params={"id": f"eq.{account_id}"},
                headers={"Content-Type": "application/json", "Prefer": "return=representation"},
                json=account_payload,
            )
            patch_resp.raise_for_status()
        else:
            create_resp = await _rest_request(
                "POST",
                "integration_accounts",
                headers={
                    "Content-Type": "application/json",
                    "Prefer": "return=representation",
                },
                json=account_payload,
            )
            create_resp.raise_for_status()
            created = create_resp.json()
            account_id = created[0]["id"] if isinstance(created, list) and created else None
            if not account_id:
                return False

        token_payload = {
            "account_id": account_id,
            "encrypted_access_token": encrypt_secret(access_token),
            "encrypted_refresh_token": encrypt_secret(refresh_token or ""),
            "expires_at": expires_at,
            "updated_at": now,
        }
        token_lookup = await _rest_request(
            "GET",
            "integration_tokens",
            params={"select": "account_id", "account_id": f"eq.{account_id}", "limit": "1"},
        )
        token_lookup.raise_for_status()
        token_rows = token_lookup.json()
        if isinstance(token_rows, list) and token_rows:
            token_resp = await _rest_request(
                "PATCH",
                "integration_tokens",
                params={"account_id": f"eq.{account_id}"},
                headers={"Content-Type": "application/json"},
                json=token_payload,
            )
        else:
            token_resp = await _rest_request(
                "POST",
                "integration_tokens",
                headers={"Content-Type": "application/json"},
                json=token_payload,
            )
        token_resp.raise_for_status()
        return True
    except (httpx.HTTPError, ValueError, KeyError):
        return False


async def fetch_health_row_for_date(date_value: str) -> Dict[str, Any]:
    if not supabase_is_configured():
        return {}

    table = _table_name()
    if not table or not date_value:
        return {}

    try:
        response = await _rest_request(
            "GET",
            table,
            params={
                "select": ",".join(PUBLIC_HEALTH_FIELDS),
                "date": f"eq.{date_value}",
                "limit": "1",
            },
        )
        response.raise_for_status()
        rows = response.json()
        if isinstance(rows, list) and rows and isinstance(rows[0], dict):
            return rows[0]
    except (httpx.HTTPError, ValueError):
        pass

    return {}


def _merge_health_row(existing: Dict[str, Any], incoming: Dict[str, Any]) -> Dict[str, Any]:
    merged = dict(incoming)
    merge_fields = (
        "sleep_score",
        "recovery_score",
        "strain",
        "resting_heart_rate",
        "hrv_trend",
        "weight_trend",
    )
    for field in merge_fields:
        if merged.get(field) is None and existing.get(field) is not None:
            merged[field] = existing.get(field)
    if incoming.get("source_status") == "partial" or existing.get("source_status") == "partial":
        merged["source_status"] = "partial"
    return merged


async def upsert_health_summary_row(row: Dict[str, Any]) -> bool:
    if not supabase_is_configured():
        return False
    table = _table_name()
    if not table:
        return False

    date_value = _safe_text(row.get("date"), max_chars=16)
    existing = await fetch_health_row_for_date(date_value or "")
    payload = _merge_health_row(
        existing,
        {
            "date": date_value,
            "sleep_score": _safe_int(row.get("sleep_score")),
            "recovery_score": _safe_int(row.get("recovery_score")),
            "strain": _safe_number(row.get("strain")),
            "resting_heart_rate": _safe_int(row.get("resting_heart_rate")),
            "hrv_trend": _safe_text(row.get("hrv_trend")),
            "weight_trend": _safe_text(row.get("weight_trend"), max_chars=80),
            "source_status": _safe_text(row.get("source_status")) or "synced",
            "last_synced_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
            "updated_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        },
    )

    try:
        response = await _rest_request(
            "POST",
            table,
            headers={
                "Content-Type": "application/json",
                "Prefer": "resolution=merge-duplicates",
            },
            params={"on_conflict": "date"},
            json=payload,
        )
        response.raise_for_status()
        return True
    except (httpx.HTTPError, ValueError):
        return False


async def update_sync_state(provider: str, **fields: Any) -> None:
    _local_sync_state[provider] = {
        **(_local_sync_state.get(provider) or {}),
        **fields,
        "provider": provider,
        "updated_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
    }
    if not supabase_is_configured():
        return
    payload = {
        "provider": provider,
        "updated_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        **fields,
    }
    try:
        await _rest_request(
            "POST",
            "integration_sync_state",
            headers={
                "Content-Type": "application/json",
                "Prefer": "resolution=merge-duplicates",
            },
            params={"on_conflict": "provider"},
            json=payload,
        )
    except (httpx.HTTPError, ValueError):
        return


async def fetch_sync_state(provider: str) -> Dict[str, Any]:
    if not supabase_is_configured():
        return dict(_local_sync_state.get(provider) or {})

    try:
        response = await _rest_request(
            "GET",
            "integration_sync_state",
            params={
                "select": "provider,channel_id,channel_token,resource_id,channel_expires_at,last_success_at,last_error,updated_at",
                "provider": f"eq.{provider}",
                "limit": "1",
            },
        )
        response.raise_for_status()
        rows = response.json()
        if isinstance(rows, list) and rows:
            return rows[0]
    except (httpx.HTTPError, ValueError):
        pass

    return dict(_local_sync_state.get(provider) or {})

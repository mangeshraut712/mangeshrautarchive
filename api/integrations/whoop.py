import os
from datetime import datetime, timezone
from typing import Any, Dict
from urllib.parse import urlencode

import httpx

PROVIDER = "whoop"
AUTH_URL = "https://api.prod.whoop.com/oauth/oauth2/auth"
TOKEN_URL = "https://api.prod.whoop.com/oauth/oauth2/token"
API_BASE = "https://api.prod.whoop.com/v2"
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
    return (
        os.getenv("WHOOP_REDIRECT_URI", "").strip()
        or "https://mangeshraut.pro/api/integrations/whoop/callback"
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
    payload = {
        "grant_type": "refresh_token",
        "refresh_token": refresh_token,
        "client_id": _client_id(),
        "client_secret": _client_secret(),
        "scope": " ".join(SCOPES),
    }
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.post(TOKEN_URL, data=payload)
    response.raise_for_status()
    return response.json()


async def _get_json(access_token: str, path: str) -> Dict[str, Any]:
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(
            f"{API_BASE}{path}",
            headers={"Authorization": f"Bearer {access_token}"},
        )
    response.raise_for_status()
    return response.json()


async def fetch_sanitized_summary(access_token: str) -> Dict[str, Any]:
    today = datetime.now(timezone.utc).date().isoformat()
    summary: Dict[str, Any] = {
        "date": today,
        "sleep_score": None,
        "recovery_score": None,
        "strain": None,
        "resting_heart_rate": None,
        "hrv_trend": None,
        "weight_trend": None,
        "source_status": "synced",
    }

    try:
        recovery = await _get_json(access_token, "/recovery?limit=1")
        records = recovery.get("records") or []
        if records:
            score = records[0].get("score") or {}
            summary["recovery_score"] = score.get("recovery_score")
            summary["resting_heart_rate"] = score.get("resting_heart_rate")
            hrv = score.get("hrv_rmssd_milli")
            if isinstance(hrv, (int, float)):
                summary["hrv_trend"] = "stable" if hrv >= 50 else "low"
    except httpx.HTTPError:
        summary["source_status"] = "partial"

    try:
        cycles = await _get_json(access_token, "/cycle?limit=1")
        records = cycles.get("records") or []
        if records:
            strain = records[0].get("score", {}).get("strain")
            if strain is not None:
                summary["strain"] = round(float(strain), 1)
    except httpx.HTTPError:
        summary["source_status"] = "partial"

    try:
        sleep = await _get_json(access_token, "/activity/sleep?limit=1")
        records = sleep.get("records") or []
        if records:
            performance = records[0].get("score", {}).get("sleep_performance_percentage")
            if performance is not None:
                summary["sleep_score"] = int(round(float(performance)))
    except httpx.HTTPError:
        summary["source_status"] = "partial"

    return summary

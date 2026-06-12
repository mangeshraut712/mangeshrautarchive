import hashlib
import hmac
import os
import time
from datetime import datetime, timezone
from typing import Any, Dict
from urllib.parse import urlencode

import httpx

PROVIDER = "withings"
AUTH_URL = "https://account.withings.com/oauth2_user/authorize2"
TOKEN_URL = "https://wbsapi.withings.net/v2/oauth2"
MEASURE_URL = "https://wbsapi.withings.net/measure"
SCOPES = ("user.metrics", "user.activity")


def _client_id() -> str:
    return os.getenv("WITHINGS_CLIENT_ID", "").strip()


def _client_secret() -> str:
    return os.getenv("WITHINGS_CLIENT_SECRET", "").strip()


def _redirect_uri() -> str:
    return (
        os.getenv("WITHINGS_REDIRECT_URI", "").strip()
        or "https://mangeshraut.pro/api/integrations/withings/callback"
    )


def is_configured() -> bool:
    return bool(_client_id() and _client_secret())


def _sign_params(params: Dict[str, Any]) -> str:
    ordered = "".join(str(params[key]) for key in sorted(params.keys()))
    digest = hmac.new(
        _client_secret().encode("utf-8"),
        ordered.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    return digest


def build_authorize_url(state: str) -> str:
    params = {
        "response_type": "code",
        "client_id": _client_id(),
        "redirect_uri": _redirect_uri(),
        "scope": ",".join(SCOPES),
        "state": state,
    }
    return f"{AUTH_URL}?{urlencode(params)}"


async def _request_token(payload: Dict[str, Any]) -> Dict[str, Any]:
    body = {**payload, "client_id": _client_id(), "client_secret": _client_secret()}
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.post(TOKEN_URL, data=body)
    response.raise_for_status()
    data = response.json()
    if data.get("status") != 0:
        raise ValueError(data.get("error") or "Withings token request failed")
    return data.get("body") or {}


async def exchange_code(code: str) -> Dict[str, Any]:
    body = await _request_token(
        {
            "action": "requesttoken",
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": _redirect_uri(),
        }
    )
    return {
        "access_token": body.get("access_token"),
        "refresh_token": body.get("refresh_token"),
        "expires_in": body.get("expires_in"),
        "userid": body.get("userid"),
    }


async def refresh_access_token(refresh_token: str) -> Dict[str, Any]:
    body = await _request_token(
        {
            "action": "requesttoken",
            "grant_type": "refresh_token",
            "refresh_token": refresh_token,
        }
    )
    return {
        "access_token": body.get("access_token"),
        "refresh_token": body.get("refresh_token") or refresh_token,
        "expires_in": body.get("expires_in"),
    }


async def fetch_sanitized_summary(access_token: str) -> Dict[str, Any]:
    today = datetime.now(timezone.utc).date().isoformat()
    enddate = int(time.time())
    startdate = enddate - 7 * 24 * 3600
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

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.post(
            MEASURE_URL,
            headers={"Authorization": f"Bearer {access_token}"},
            data={
                "action": "getmeas",
                "category": 1,
                "startdate": startdate,
                "enddate": enddate,
            },
        )
    response.raise_for_status()
    payload = response.json()
    if payload.get("status") != 0:
        summary["source_status"] = "partial"
        return summary

    groups = (payload.get("body") or {}).get("measuregrps") or []
    latest_weight = None
    latest_fat = None
    for group in groups:
        for measure in group.get("measures") or []:
            value = measure.get("value")
            unit = measure.get("unit") or 0
            if value is None:
                continue
            amount = float(value) * (10 ** int(unit))
            meas_type = measure.get("type")
            if meas_type == 1:
                latest_weight = amount / 1000.0
            if meas_type in (6, 174):
                latest_fat = amount

    if latest_weight is not None:
        summary["weight_trend"] = f"{latest_weight:.1f} kg"
    if latest_fat is not None:
        summary["weight_trend"] = (
            f"{latest_weight:.1f} kg" if latest_weight else summary["weight_trend"] or ""
        )
        if latest_fat <= 100:
            summary["weight_trend"] = (
                (summary["weight_trend"] + f" · {latest_fat:.1f}% fat").strip(" ·")
                if summary["weight_trend"]
                else f"{latest_fat:.1f}% fat"
            )

    return summary

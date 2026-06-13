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


# Withings measure types (https://developer.withings.com/developer-guide/v3/data-api/all-metrics)
_MEASURE_WEIGHT_KG = 1
_MEASURE_FAT_RATIO_PCT = 6
_MEASURE_FAT_MASS_KG = 8
_MEASURE_MUSCLE_MASS_KG = 76


def _decode_measure_amount(measure: Dict[str, Any]) -> float | None:
    value = measure.get("value")
    if value is None:
        return None
    unit = measure.get("unit") or 0
    return float(value) * (10 ** int(unit))


def _extract_group_measures(group: Dict[str, Any]) -> Dict[int, float]:
    extracted: Dict[int, float] = {}
    for measure in group.get("measures") or []:
        meas_type = measure.get("type")
        if meas_type is None:
            continue
        amount = _decode_measure_amount(measure)
        if amount is not None:
            extracted[int(meas_type)] = amount
    return extracted


def _latest_body_comp_measures(groups: list) -> Dict[int, float]:
    """Return measures from the most recent weigh-in group (must include weight)."""
    sorted_groups = sorted(groups or [], key=lambda group: group.get("date") or 0, reverse=True)
    for group in sorted_groups:
        measures = _extract_group_measures(group)
        if _MEASURE_WEIGHT_KG in measures:
            return measures
    return {}


def _resolve_fat_ratio_pct(measures: Dict[int, float]) -> float | None:
    fat_ratio = measures.get(_MEASURE_FAT_RATIO_PCT)
    if fat_ratio is not None and 3 <= fat_ratio <= 75:
        return round(fat_ratio, 1)

    weight = measures.get(_MEASURE_WEIGHT_KG)
    fat_mass = measures.get(_MEASURE_FAT_MASS_KG)
    if weight and fat_mass and weight > 0:
        derived = (fat_mass / weight) * 100
        if 3 <= derived <= 75:
            return round(derived, 1)
    return None


def _resolve_muscle_ratio_pct(measures: Dict[int, float]) -> float | None:
    weight = measures.get(_MEASURE_WEIGHT_KG)
    muscle_mass = measures.get(_MEASURE_MUSCLE_MASS_KG)
    if not weight or not muscle_mass or weight <= 0:
        return None
    derived = (muscle_mass / weight) * 100
    if 20 <= derived <= 95:
        return round(derived, 1)
    return None


def format_weight_trend(measures: Dict[int, float]) -> str | None:
    weight = measures.get(_MEASURE_WEIGHT_KG)
    if weight is None:
        return None

    parts = [f"{weight:.1f} kg"]
    muscle_pct = _resolve_muscle_ratio_pct(measures)
    fat_pct = _resolve_fat_ratio_pct(measures)

    if muscle_pct is not None:
        parts.append(f"{muscle_pct:.1f}% muscle")
    if fat_pct is not None:
        parts.append(f"{fat_pct:.1f}% fat")

    return " · ".join(parts)


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
    measures = _latest_body_comp_measures(groups)
    weight_trend = format_weight_trend(measures)
    if weight_trend:
        summary["weight_trend"] = weight_trend
    elif groups:
        summary["source_status"] = "partial"

    return summary

import os
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List
from urllib.parse import urlencode

import httpx

PROVIDER = "google_calendar"
SCOPES = (
    "https://www.googleapis.com/auth/calendar.readonly",
    "https://www.googleapis.com/auth/calendar.freebusy",
)


def _client_id() -> str:
    return os.getenv("GOOGLE_CALENDAR_CLIENT_ID", "").strip()


def _client_secret() -> str:
    return os.getenv("GOOGLE_CALENDAR_CLIENT_SECRET", "").strip()


def _redirect_uri() -> str:
    return (
        os.getenv("GOOGLE_CALENDAR_REDIRECT_URI", "").strip()
        or "https://mangeshraut.pro/api/calendar/callback/google"
    )


def is_configured() -> bool:
    return bool(_client_id() and _client_secret())


def build_authorize_url(state: str) -> str:
    params = {
        "client_id": _client_id(),
        "redirect_uri": _redirect_uri(),
        "response_type": "code",
        "scope": " ".join(SCOPES),
        "access_type": "offline",
        "prompt": "consent",
        "include_granted_scopes": "true",
        "state": state,
    }
    return f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"


async def exchange_code(code: str) -> Dict[str, Any]:
    payload = {
        "code": code,
        "client_id": _client_id(),
        "client_secret": _client_secret(),
        "redirect_uri": _redirect_uri(),
        "grant_type": "authorization_code",
    }
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.post("https://oauth2.googleapis.com/token", data=payload)
    response.raise_for_status()
    return response.json()


async def fetch_user_email(access_token: str) -> str:
    """Resolve a stable account identifier without requiring userinfo OAuth scopes."""
    async with httpx.AsyncClient(timeout=8.0) as client:
        response = await client.get(
            "https://oauth2.googleapis.com/tokeninfo",
            params={"access_token": access_token},
        )
    response.raise_for_status()
    data = response.json()
    return str(data.get("email") or data.get("sub") or "google-calendar-user")


def _day_bounds(day_offset: int) -> Dict[str, str]:
    base = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    start = base + timedelta(days=day_offset)
    end = start + timedelta(days=1)

    def fmt(dt):
        return dt.isoformat().replace("+00:00", "Z")

    return {"start": fmt(start), "end": fmt(end)}


async def fetch_availability(access_token: str, days: int = 7) -> List[Dict[str, Any]]:
    now = datetime.now(timezone.utc)
    time_min = now.replace(hour=0, minute=0, second=0, microsecond=0)
    time_max = time_min + timedelta(days=max(1, min(days, 14)))

    payload = {
        "timeMin": time_min.isoformat().replace("+00:00", "Z"),
        "timeMax": time_max.isoformat().replace("+00:00", "Z"),
        "timeZone": "UTC",
        "items": [{"id": "primary"}],
    }
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.post(
            "https://www.googleapis.com/calendar/v3/freeBusy",
            headers={"Authorization": f"Bearer {access_token}"},
            json=payload,
        )
    response.raise_for_status()
    body = response.json()
    calendars = body.get("calendars") or {}
    primary = calendars.get("primary") or {}
    busy_blocks = primary.get("busy") or []

    results: List[Dict[str, Any]] = []
    for offset in range(max(1, min(days, 14))):
        bounds = _day_bounds(offset)
        day_busy = []
        for block in busy_blocks:
            start = block.get("start")
            end = block.get("end")
            if not start or not end:
                continue
            if start[:10] == bounds["start"][:10] or end[:10] == bounds["start"][:10]:
                day_busy.append({"start": start, "end": end})
        results.append(
            {
                "date": bounds["start"][:10],
                "busy": day_busy,
                "freeBlocks": max(0, 1 - min(1, len(day_busy))),
            }
        )
    return results


async def refresh_access_token(refresh_token: str) -> Dict[str, Any]:
    payload = {
        "client_id": _client_id(),
        "client_secret": _client_secret(),
        "grant_type": "refresh_token",
        "refresh_token": refresh_token,
    }
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.post("https://oauth2.googleapis.com/token", data=payload)
    response.raise_for_status()
    return response.json()


async def register_watch(
    access_token: str,
    webhook_url: str,
    channel_id: str,
    channel_token: str,
) -> Dict[str, Any]:
    payload = {
        "id": channel_id,
        "type": "web_hook",
        "address": webhook_url,
        "token": channel_token,
    }
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.post(
            "https://www.googleapis.com/calendar/v3/calendars/primary/events/watch",
            headers={"Authorization": f"Bearer {access_token}"},
            json=payload,
        )
    response.raise_for_status()
    return response.json()

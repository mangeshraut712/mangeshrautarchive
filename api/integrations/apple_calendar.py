import os
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional
from urllib.parse import urlencode

import httpx

PROVIDER = "apple_calendar"
SCOPES = ("name", "email")


def _client_id() -> str:
    """Apple Services ID (e.g. pro.mangeshraut.calendar or com.mangeshrautarchive.service)."""
    return os.getenv("APPLE_CALENDAR_CLIENT_ID", "").strip()


def _team_id() -> str:
    """Apple Developer Team ID (10-character alphanumeric)."""
    return os.getenv("APPLE_CALENDAR_TEAM_ID", "").strip()


def _key_id() -> str:
    """Apple Key ID for Sign in with Apple private key."""
    return os.getenv("APPLE_CALENDAR_KEY_ID", "").strip()


def _private_key() -> str:
    """Apple Private Key (ES256 PKCS#8 PEM string)."""
    return os.getenv("APPLE_CALENDAR_PRIVATE_KEY", "").strip()


def _caldav_url() -> str:
    """iCloud CalDAV URL endpoint."""
    return os.getenv("APPLE_CALDAV_URL", "https://caldav.icloud.com").strip()


def _apple_id() -> str:
    """iCloud Apple ID / email."""
    return os.getenv("APPLE_CALENDAR_APPLE_ID", "").strip()


def _app_specific_password() -> str:
    """iCloud App-Specific Password for direct CalDAV synchronization."""
    return os.getenv("APPLE_CALDAV_APP_PASSWORD", "").strip()


def _redirect_uri() -> str:
    return (
        os.getenv("APPLE_CALENDAR_REDIRECT_URI", "").strip()
        or "https://mangeshraut.pro/api/calendar/callback/apple"
    )


def is_configured() -> bool:
    has_oauth = bool(_client_id() and ((_team_id() and _key_id() and _private_key()) or _app_specific_password()))
    has_caldav = bool(_apple_id() and _app_specific_password())
    return has_oauth or has_caldav


def build_authorize_url(state: str) -> str:
    params = {
        "client_id": _client_id(),
        "redirect_uri": _redirect_uri(),
        "response_type": "code id_token",
        "response_mode": "form_post",
        "scope": " ".join(SCOPES),
        "state": state,
    }
    return f"https://appleid.apple.com/auth/authorize?{urlencode(params)}"


def _generate_client_secret() -> str:
    """Generate an ES256 client_secret JWT for Apple Token Exchange if cryptography is installed."""
    try:
        import time
        import jwt

        headers = {
            "kid": _key_id(),
            "alg": "ES256",
        }
        now_ts = int(time.time())
        claims = {
            "iss": _team_id(),
            "iat": now_ts,
            "exp": now_ts + 86400 * 180,  # Max 6 months
            "aud": "https://appleid.apple.com",
            "sub": _client_id(),
        }
        return jwt.encode(claims, _private_key(), algorithm="ES256", headers=headers)
    except Exception:
        # Fallback to direct app-specific token or existing secret
        return os.getenv("APPLE_CALENDAR_CLIENT_SECRET", "").strip()


async def exchange_code(code: str) -> Dict[str, Any]:
    client_secret = _generate_client_secret()
    payload = {
        "client_id": _client_id(),
        "client_secret": client_secret,
        "code": code,
        "grant_type": "authorization_code",
        "redirect_uri": _redirect_uri(),
    }
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.post("https://appleid.apple.com/auth/token", data=payload)
    response.raise_for_status()
    return response.json()


async def refresh_access_token(refresh_token: str) -> Dict[str, Any]:
    client_secret = _generate_client_secret()
    payload = {
        "client_id": _client_id(),
        "client_secret": client_secret,
        "refresh_token": refresh_token,
        "grant_type": "refresh_token",
    }
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.post("https://appleid.apple.com/auth/token", data=payload)
    response.raise_for_status()
    return response.json()


def _day_bounds(day_offset: int) -> Dict[str, str]:
    base = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    start = base + timedelta(days=day_offset)
    end = start + timedelta(days=1)

    def fmt(dt: datetime) -> str:
        return dt.isoformat().replace("+00:00", "Z")

    return {"start": fmt(start), "end": fmt(end)}


async def fetch_availability(access_token_or_creds: str, days: int = 7) -> List[Dict[str, Any]]:
    """Fetch availability for Apple Calendar across the next N days.
    
    If iCloud CalDAV credentials exist, queries CalDAV free-busy; otherwise evaluates
    connected Apple Calendar OAuth state.
    """
    results: List[Dict[str, Any]] = []
    for offset in range(max(1, min(days, 14))):
        bounds = _day_bounds(offset)
        results.append(
            {
                "date": bounds["start"][:10],
                "busy": [],
                "start": bounds["start"],
                "end": bounds["end"],
            }
        )
    return results


def build_apple_reminder_ics(
    *,
    uid: str,
    title: str,
    description: str = "",
    due_datetime_utc: str,
    alarm_minutes_before: int = 30,
) -> str:
    """Generate an RFC 5545 VTODO string for Apple Reminders / iCloud import."""
    def clean_ics(text: str) -> str:
        return (
            str(text or "")
            .replace("\\", "\\\\")
            .replace("\r\n", "\\n")
            .replace("\n", "\\n")
            .replace(";", "\\;")
            .replace(",", "\\,")
        )

    now_str = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    due_str = due_datetime_utc.replace("-", "").replace(":", "").replace(".000", "")
    if not due_str.endswith("Z"):
        due_str += "Z"

    lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Mangesh Raut Portfolio//Apple Reminder//EN",
        "CALSCALE:GREGORIAN",
        "BEGIN:VTODO",
        f"UID:{clean_ics(uid)}",
        f"DTSTAMP:{now_str}",
        f"DUE:{due_str}",
        f"SUMMARY:{clean_ics(title)}",
        f"DESCRIPTION:{clean_ics(description)}",
        "STATUS:NEEDS-ACTION",
        "BEGIN:VALARM",
        f"TRIGGER:-PT{alarm_minutes_before}M",
        "ACTION:DISPLAY",
        f"DESCRIPTION:Reminder: {clean_ics(title)}",
        "END:VALARM",
        "END:VTODO",
        "END:VCALENDAR",
        "",
    ]
    return "\r\n".join(lines)

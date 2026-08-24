import os
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple
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


def _parse_ics_datetime(val: Optional[str]) -> Optional[str]:
    if not val:
        return None
    val = val.strip()
    try:
        if "T" in val:
            clean = val.replace("Z", "")
            if len(clean) >= 15:
                dt = datetime.strptime(clean[:15], "%Y%m%dT%H%M%S").replace(tzinfo=timezone.utc)
                return dt.isoformat().replace("+00:00", "Z")
        elif len(val) >= 8 and val[:8].isdigit():
            dt = datetime.strptime(val[:8], "%Y%m%d").replace(tzinfo=timezone.utc)
            return dt.isoformat().replace("+00:00", "Z")
    except Exception:
        pass
    return None


def _join_url(base: str, path: str) -> str:
    if path.startswith("http://") or path.startswith("https://"):
        return path
    return f"{base.rstrip('/')}/{path.lstrip('/')}"


async def _fetch_caldav_calendar_data(
    app_password_override: str = "",
    days: int = 14,
) -> Tuple[Dict[str, List[Dict[str, str]]], List[Dict[str, Any]]]:
    """Query Apple iCloud CalDAV to extract real events and busy windows."""
    import re
    import xml.etree.ElementTree as ET

    apple_id = _apple_id()
    app_pwd = app_password_override.strip() if app_password_override.strip() else _app_specific_password()
    if not apple_id or not app_pwd:
        return {}, []

    auth = (apple_id, app_pwd)
    base_url = _caldav_url()
    busy_by_date: Dict[str, List[Dict[str, str]]] = {}
    events: List[Dict[str, Any]] = []

    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            # 1. Principal discovery
            propfind_body = """<?xml version="1.0" encoding="utf-8" ?>
<D:propfind xmlns:D="DAV:"><D:prop><D:current-user-principal/></D:prop></D:propfind>"""
            res = await client.request(
                "PROPFIND",
                base_url,
                content=propfind_body,
                headers={"Depth": "0"},
                auth=auth,
            )
            if res.status_code != 207:
                return {}, []

            root = ET.fromstring(res.text)
            principal_el = root.find(".//{DAV:}current-user-principal/{DAV:}href")
            if principal_el is None or not principal_el.text:
                return {}, []
            principal = principal_el.text.strip()

            # 2. Calendar Home Set discovery
            p_url = _join_url(base_url, principal)
            home_body = """<?xml version="1.0" encoding="utf-8" ?>
<D:propfind xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav"><D:prop><C:calendar-home-set/></D:prop></D:propfind>"""
            res2 = await client.request(
                "PROPFIND",
                p_url,
                content=home_body,
                headers={"Depth": "0"},
                auth=auth,
            )
            if res2.status_code != 207:
                return {}, []

            root2 = ET.fromstring(res2.text)
            cal_home_el = root2.find(".//{urn:ietf:params:xml:ns:caldav}calendar-home-set/{DAV:}href")
            if cal_home_el is None or not cal_home_el.text:
                return {}, []
            cal_home = cal_home_el.text.strip()

            parts = cal_home.split("/")
            home_base = "/".join(parts[:3]) if len(parts) >= 3 else base_url

            # 3. List calendar collections
            list_body = """<?xml version="1.0" encoding="utf-8" ?>
<D:propfind xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav"><D:prop><D:resourcetype/><D:displayname/></D:prop></D:propfind>"""
            res3 = await client.request(
                "PROPFIND",
                cal_home,
                content=list_body,
                headers={"Depth": "1"},
                auth=auth,
            )
            if res3.status_code != 207:
                return {}, []

            root3 = ET.fromstring(res3.text)
            now = datetime.now(timezone.utc)
            start_iso_q = (now - timedelta(days=1)).strftime("%Y%m%dT000000Z")
            end_iso_q = (now + timedelta(days=days + 1)).strftime("%Y%m%dT235959Z")

            report_body = f"""<?xml version="1.0" encoding="utf-8" ?>
<C:calendar-query xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">
  <D:prop><D:getetag/><C:calendar-data/></D:prop>
  <C:filter>
    <C:comp-filter name="VCALENDAR">
      <C:comp-filter name="VEVENT">
        <C:time-range start="{start_iso_q}" end="{end_iso_q}"/>
      </C:comp-filter>
    </C:comp-filter>
  </C:filter>
</C:calendar-query>"""

            seen_keys = set()

            for resp in root3.findall("{DAV:}response"):
                href_el = resp.find("{DAV:}href")
                if href_el is None or not href_el.text:
                    continue
                href = href_el.text.strip()
                if any(skip in href for skip in ["/inbox", "/outbox", "/notification"]):
                    continue
                if href.rstrip("/") == cal_home.replace(home_base, "").rstrip("/"):
                    continue

                cal_url = _join_url(home_base, href)
                try:
                    res_rep = await client.request(
                        "REPORT",
                        cal_url,
                        content=report_body,
                        headers={"Depth": "1", "Content-Type": "application/xml; charset=utf-8"},
                        auth=auth,
                    )
                    if res_rep.status_code == 207:
                        root_rep = ET.fromstring(res_rep.text)
                        for item in root_rep.findall("{DAV:}response"):
                            cdata = item.find(".//{urn:ietf:params:xml:ns:caldav}calendar-data")
                            if cdata is not None and cdata.text:
                                text = cdata.text
                                summary_m = re.search(r"^SUMMARY:(.+)$", text, re.M)
                                dtstart_m = re.search(r"^DTSTART(?:;[^:]+)?:(.+)$", text, re.M)
                                dtend_m = re.search(r"^DTEND(?:;[^:]+)?:(.+)$", text, re.M)
                                if summary_m and dtstart_m:
                                    title = summary_m.group(1).strip()
                                    s_iso = _parse_ics_datetime(dtstart_m.group(1).strip())
                                    e_iso = (
                                        _parse_ics_datetime(dtend_m.group(1).strip())
                                        if dtend_m
                                        else s_iso
                                    )
                                    if s_iso:
                                        d_str = s_iso[:10]
                                        key = f"{title}_{s_iso}"
                                        if key not in seen_keys:
                                            seen_keys.add(key)
                                            events.append(
                                                {
                                                    "title": title,
                                                    "start": s_iso,
                                                    "end": e_iso or s_iso,
                                                    "date": d_str,
                                                    "provider": "apple",
                                                }
                                            )
                                            busy_by_date.setdefault(d_str, []).append(
                                                {"start": s_iso, "end": e_iso or s_iso}
                                            )
                except Exception:
                    continue
    except Exception:
        pass

    return busy_by_date, events


async def fetch_events(access_token_or_creds: str = "", days: int = 14) -> List[Dict[str, Any]]:
    """Fetch real upcoming events from Apple iCloud Calendar."""
    _, events = await _fetch_caldav_calendar_data(app_password_override=access_token_or_creds, days=days)
    return events


async def fetch_availability(access_token_or_creds: str = "", days: int = 7) -> List[Dict[str, Any]]:
    """Fetch availability for Apple Calendar across the next N days."""
    busy_by_date, _ = await _fetch_caldav_calendar_data(app_password_override=access_token_or_creds, days=days)
    results: List[Dict[str, Any]] = []
    for offset in range(max(1, min(days, 14))):
        bounds = _day_bounds(offset)
        d_str = bounds["start"][:10]
        results.append(
            {
                "date": d_str,
                "busy": busy_by_date.get(d_str, []),
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

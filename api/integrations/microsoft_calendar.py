import os
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional
from urllib.parse import urlencode

import httpx

PROVIDER = "microsoft_calendar"
SCOPES = (
    "offline_access",
    "User.Read",
    "Calendars.Read",
    "Calendars.Read.Shared",
    "Tasks.ReadWrite",
)


def _client_id() -> str:
    return os.getenv("MICROSOFT_CALENDAR_CLIENT_ID", "").strip()


def _client_secret() -> str:
    return os.getenv("MICROSOFT_CALENDAR_CLIENT_SECRET", "").strip()


def _tenant_id() -> str:
    return os.getenv("MICROSOFT_CALENDAR_TENANT_ID", "").strip() or "common"


def _redirect_uri() -> str:
    return (
        os.getenv("MICROSOFT_CALENDAR_REDIRECT_URI", "").strip()
        or "https://mangeshraut.pro/api/calendar/callback/microsoft"
    )


def is_configured() -> bool:
    return bool(_client_id() and _client_secret())


def build_authorize_url(state: str) -> str:
    params = {
        "client_id": _client_id(),
        "response_type": "code",
        "redirect_uri": _redirect_uri(),
        "response_mode": "query",
        "scope": " ".join(SCOPES),
        "state": state,
        "prompt": "consent",
    }
    tenant = _tenant_id()
    return f"https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize?{urlencode(params)}"


async def exchange_code(code: str) -> Dict[str, Any]:
    tenant = _tenant_id()
    payload = {
        "client_id": _client_id(),
        "client_secret": _client_secret(),
        "code": code,
        "redirect_uri": _redirect_uri(),
        "grant_type": "authorization_code",
        "scope": " ".join(SCOPES),
    }
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.post(
            f"https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token",
            data=payload,
        )
    response.raise_for_status()
    return response.json()


async def refresh_access_token(refresh_token: str) -> Dict[str, Any]:
    tenant = _tenant_id()
    payload = {
        "client_id": _client_id(),
        "client_secret": _client_secret(),
        "refresh_token": refresh_token,
        "grant_type": "refresh_token",
        "scope": " ".join(SCOPES),
    }
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.post(
            f"https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token",
            data=payload,
        )
    response.raise_for_status()
    return response.json()


async def fetch_user_email(access_token: str) -> str:
    """Resolve user identity from Microsoft Graph /me endpoint."""
    async with httpx.AsyncClient(timeout=8.0) as client:
        response = await client.get(
            "https://graph.microsoft.com/v1.0/me",
            headers={"Authorization": f"Bearer {access_token}"},
        )
    response.raise_for_status()
    data = response.json()
    return str(data.get("mail") or data.get("userPrincipalName") or data.get("id") or "microsoft-user")


def _day_bounds(day_offset: int) -> Dict[str, str]:
    base = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    start = base + timedelta(days=day_offset)
    end = start + timedelta(days=1)

    def fmt(dt: datetime) -> str:
        return dt.isoformat().replace("+00:00", "Z")

    return {"start": fmt(start), "end": fmt(end)}


async def fetch_availability(access_token: str, days: int = 7) -> List[Dict[str, Any]]:
    """Query Microsoft Graph getSchedule API for free/busy intervals."""
    user_email = await fetch_user_email(access_token)
    now = datetime.now(timezone.utc)
    time_min = now.replace(hour=0, minute=0, second=0, microsecond=0)
    time_max = time_min + timedelta(days=max(1, min(days, 14)))

    payload = {
        "schedules": [user_email],
        "startTime": {
            "dateTime": time_min.strftime("%Y-%m-%dT00:00:00"),
            "timeZone": "UTC",
        },
        "endTime": {
            "dateTime": time_max.strftime("%Y-%m-%dT23:59:59"),
            "timeZone": "UTC",
        },
        "availabilityViewInterval": 30,
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.post(
            "https://graph.microsoft.com/v1.0/me/calendar/getSchedule",
            headers={
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json",
            },
            json=payload,
        )
    response.raise_for_status()
    body = response.json()
    value_list = body.get("value") or []
    schedule_items = value_list[0].get("scheduleItems") if value_list else []
    busy_blocks = schedule_items or []

    results: List[Dict[str, Any]] = []
    for offset in range(max(1, min(days, 14))):
        bounds = _day_bounds(offset)
        day_busy = []
        for block in busy_blocks:
            start_info = block.get("start") or {}
            end_info = block.get("end") or {}
            start = start_info.get("dateTime")
            end = end_info.get("dateTime")
            status = str(block.get("status") or "").lower()
            if status == "free":
                continue
            if not start or not end:
                continue
            if not start.endswith("Z"):
                start = f"{start}Z"
            if not end.endswith("Z"):
                end = f"{end}Z"
            if start[:10] == bounds["start"][:10] or end[:10] == bounds["start"][:10]:
                day_busy.append({"start": start, "end": end, "status": status})

        results.append(
            {
                "date": bounds["start"][:10],
                "busy": day_busy,
                "start": bounds["start"],
                "end": bounds["end"],
            }
        )
    return results


async def create_calendar_event(
    access_token: str,
    *,
    subject: str,
    body: str,
    start_utc: str,
    end_utc: str,
    attendee_email: Optional[str] = None,
    attendee_name: Optional[str] = None,
) -> Dict[str, Any]:
    """Create a private event in Outlook Calendar with optional attendee invitation."""
    event_payload: Dict[str, Any] = {
        "subject": subject,
        "body": {
            "contentType": "HTML",
            "content": body,
        },
        "start": {
            "dateTime": start_utc.rstrip("Z"),
            "timeZone": "UTC",
        },
        "end": {
            "dateTime": end_utc.rstrip("Z"),
            "timeZone": "UTC",
        },
        "isReminderOn": True,
        "reminderMinutesBeforeStart": 30,
        "sensitivity": "private",
    }
    if attendee_email:
        event_payload["attendees"] = [
            {
                "emailAddress": {
                    "address": attendee_email,
                    "name": attendee_name or attendee_email,
                },
                "type": "required",
            }
        ]

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.post(
            "https://graph.microsoft.com/v1.0/me/events",
            headers={
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json",
            },
            json=event_payload,
        )
    response.raise_for_status()
    return response.json()


async def create_todo_task(
    access_token: str,
    *,
    title: str,
    content: str,
    due_datetime_utc: str,
    reminder_datetime_utc: Optional[str] = None,
) -> Dict[str, Any]:
    """Create a synchronized task reminder in Microsoft To-Do."""
    task_payload: Dict[str, Any] = {
        "title": title,
        "body": {
            "contentType": "text",
            "content": content,
        },
        "dueDateTime": {
            "dateTime": due_datetime_utc.rstrip("Z"),
            "timeZone": "UTC",
        },
    }
    if reminder_datetime_utc:
        task_payload["isReminderOn"] = True
        task_payload["reminderDateTime"] = {
            "dateTime": reminder_datetime_utc.rstrip("Z"),
            "timeZone": "UTC",
        }

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.post(
            "https://graph.microsoft.com/v1.0/me/todo/lists/tasks/tasks",
            headers={
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json",
            },
            json=task_payload,
        )
    response.raise_for_status()
    return response.json()

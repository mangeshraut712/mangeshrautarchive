import os
from datetime import datetime, timezone
from typing import Any, Dict, Optional, Tuple

import httpx

from api.integrations import whoop, withings
from api.integrations.supabase_store import get_provider_token_bundle, save_provider_tokens


def _parse_expires_at(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    try:
        normalized = value.replace("Z", "+00:00")
        return datetime.fromisoformat(normalized)
    except ValueError:
        return None


def _expires_soon(expires_at: Optional[str], skew_seconds: int = 120) -> bool:
    parsed = _parse_expires_at(expires_at)
    if not parsed:
        return False
    remaining = (parsed - datetime.now(timezone.utc)).total_seconds()
    return remaining <= skew_seconds


async def _refresh_google(refresh_token: str) -> Dict[str, Any]:
    payload = {
        "client_id": os.getenv("GOOGLE_CALENDAR_CLIENT_ID", "").strip(),
        "client_secret": os.getenv("GOOGLE_CALENDAR_CLIENT_SECRET", "").strip(),
        "grant_type": "refresh_token",
        "refresh_token": refresh_token,
    }
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.post("https://oauth2.googleapis.com/token", data=payload)
    response.raise_for_status()
    return response.json()


async def get_valid_access_token(provider: str) -> Optional[str]:
    bundle = await get_provider_token_bundle(provider)
    if not bundle:
        return None

    access_token = bundle.get("access_token")
    refresh_token = bundle.get("refresh_token")
    expires_at = bundle.get("expires_at")
    subject = bundle.get("provider_subject") or provider
    scopes = bundle.get("scopes") or []

    if access_token and not _expires_soon(expires_at):
        return access_token

    if not refresh_token:
        return access_token

    try:
        if provider == "google_calendar":
            refreshed = await _refresh_google(refresh_token)
        elif provider == "whoop":
            refreshed = await whoop.refresh_access_token(refresh_token)
        elif provider == "withings":
            refreshed = await withings.refresh_access_token(refresh_token)
        else:
            return access_token

        new_access = refreshed.get("access_token")
        if not new_access:
            return access_token

        new_refresh = refreshed.get("refresh_token") or refresh_token
        expires_in = refreshed.get("expires_in")
        new_expires = None
        if expires_in:
            new_expires = datetime.fromtimestamp(
                datetime.now(timezone.utc).timestamp() + float(expires_in),
                timezone.utc,
            ).isoformat().replace("+00:00", "Z")

        await save_provider_tokens(
            provider,
            provider_subject=subject,
            scopes=list(scopes),
            access_token=new_access,
            refresh_token=new_refresh,
            expires_at=new_expires,
        )
        return new_access
    except (httpx.HTTPError, ValueError):
        return access_token


async def get_token_metadata(provider: str) -> Tuple[Optional[str], Optional[str]]:
    token = await get_valid_access_token(provider)
    bundle = await get_provider_token_bundle(provider)
    expires_at = bundle.get("expires_at") if bundle else None
    return token, expires_at

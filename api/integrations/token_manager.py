import asyncio
import logging
import os
from datetime import datetime, timezone
from typing import Any, Dict, Optional, Tuple

import httpx

from api.integrations import whoop, withings
from api.integrations.supabase_store import (
    acquire_token_refresh_lock,
    get_provider_token_bundle,
    mark_provider_needs_reauth,
    release_token_refresh_lock,
    save_provider_tokens,
)

logger = logging.getLogger(__name__)

# Refresh a few minutes early so cron/edge sync never races the hard expiry.
_REFRESH_SKEW_SECONDS = 300
_SAVE_ATTEMPTS = 4


def _parse_expires_at(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    try:
        normalized = value.replace("Z", "+00:00")
        return datetime.fromisoformat(normalized)
    except ValueError:
        return None


def _expires_soon(expires_at: Optional[str], skew_seconds: int = _REFRESH_SKEW_SECONDS) -> bool:
    """Treat missing/unparseable expires_at as expired so we always attempt refresh."""
    parsed = _parse_expires_at(expires_at)
    if not parsed:
        return True
    remaining = (parsed - datetime.now(timezone.utc)).total_seconds()
    return remaining <= skew_seconds


def _expires_at_from_expires_in(expires_in: Any) -> Optional[str]:
    if expires_in is None:
        return None
    try:
        seconds = float(expires_in)
    except (TypeError, ValueError):
        return None
    return datetime.fromtimestamp(
        datetime.now(timezone.utc).timestamp() + seconds,
        timezone.utc,
    ).isoformat().replace("+00:00", "Z")


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


async def _provider_refresh(provider: str, refresh_token: str) -> Dict[str, Any]:
    if provider == "google_calendar":
        return await _refresh_google(refresh_token)
    if provider == "whoop":
        return await whoop.refresh_access_token(refresh_token)
    if provider == "withings":
        return await withings.refresh_access_token(refresh_token)
    raise ValueError(f"Unsupported provider refresh: {provider}")


async def _persist_rotated_tokens(
    provider: str,
    *,
    subject: str,
    scopes: list,
    access_token: str,
    refresh_token: str,
    expires_at: Optional[str],
) -> bool:
    """WHOOP rotates refresh tokens — persistence must succeed or the grant is lost."""
    for attempt in range(1, _SAVE_ATTEMPTS + 1):
        saved = await save_provider_tokens(
            provider,
            provider_subject=subject,
            scopes=list(scopes),
            access_token=access_token,
            refresh_token=refresh_token,
            expires_at=expires_at,
        )
        if saved:
            return True
        logger.error(
            "Failed to persist rotated %s tokens (attempt %s/%s)",
            provider,
            attempt,
            _SAVE_ATTEMPTS,
        )
        await asyncio.sleep(0.15 * attempt)
    return False


async def get_valid_access_token(provider: str, *, force_refresh: bool = False) -> Optional[str]:
    """Return a usable access token, refreshing once under a distributed lock.

    WHOOP access tokens last ~1 hour and every refresh returns a *new* refresh_token.
    Concurrent refreshes (Pages + cron + multiple Worker isolates) used to burn the
    previous refresh token and force another OAuth reauth. This path is single-flight
    and recovers when another worker already rotated successfully.

    Pass force_refresh=True after a provider API returns 401 — expires_at can still look
    valid while the access token was invalidated by a lost refresh-token rotation.
    """
    bundle = await get_provider_token_bundle(provider)
    if not bundle:
        return None

    access_token = bundle.get("access_token")
    refresh_token = bundle.get("refresh_token")
    expires_at = bundle.get("expires_at")
    subject = bundle.get("provider_subject") or provider
    scopes = bundle.get("scopes") or []
    original_updated_at = bundle.get("updated_at")
    seen_updated_at = original_updated_at

    if access_token and not _expires_soon(expires_at) and not force_refresh:
        return access_token

    if not refresh_token:
        return None if (_expires_soon(expires_at) or force_refresh) else access_token

    lock_held = await acquire_token_refresh_lock(provider)
    if not lock_held:
        # Another worker is refreshing — wait briefly, then use whatever they persisted.
        await asyncio.sleep(0.75)
        raced = await get_provider_token_bundle(provider)
        if not raced:
            return None
        raced_access = raced.get("access_token")
        if raced_access and not _expires_soon(raced.get("expires_at")):
            # force_refresh still needs a newer rotation than our first read.
            if force_refresh and raced.get("updated_at") == original_updated_at:
                return None
            return raced_access
        return None

    try:
        # Re-read under the lock in case another process finished between checks.
        fresh = await get_provider_token_bundle(provider)
        if fresh:
            access_token = fresh.get("access_token") or access_token
            refresh_token = fresh.get("refresh_token") or refresh_token
            expires_at = fresh.get("expires_at")
            subject = fresh.get("provider_subject") or subject
            scopes = fresh.get("scopes") or scopes
            if access_token and not _expires_soon(expires_at) and not force_refresh:
                return access_token
            # Another worker already rotated while we waited for the lock.
            if (
                force_refresh
                and access_token
                and not _expires_soon(expires_at)
                and fresh.get("updated_at")
                and fresh.get("updated_at") != original_updated_at
            ):
                return access_token
            seen_updated_at = fresh.get("updated_at") or seen_updated_at

        if not refresh_token:
            return None

        try:
            refreshed = await _provider_refresh(provider, refresh_token)
        except httpx.HTTPStatusError as exc:
            status = exc.response.status_code if exc.response is not None else None
            # invalid_grant / 400 often means another worker already rotated this token.
            if status in {400, 401}:
                raced = await get_provider_token_bundle(provider)
                if raced and raced.get("updated_at") and raced.get("updated_at") != seen_updated_at:
                    raced_access = raced.get("access_token")
                    if raced_access and not _expires_soon(raced.get("expires_at")):
                        logger.info(
                            "%s refresh lost the race; using tokens persisted by another worker",
                            provider,
                        )
                        return raced_access
                # True dead grant — surface reconnect once instead of looping forever.
                await mark_provider_needs_reauth(provider, reason=f"refresh_http_{status}")
            logger.warning("%s token refresh failed with HTTP %s", provider, status)
            return None
        except (httpx.HTTPError, ValueError) as exc:
            logger.warning("%s token refresh failed: %s", provider, exc)
            return None

        new_access = refreshed.get("access_token")
        if not new_access:
            return None

        # Prefer the rotated refresh token. Falling back to the old one is only safe
        # for providers that do not rotate (Withings sometimes omits it).
        new_refresh = refreshed.get("refresh_token") or refresh_token
        new_expires = _expires_at_from_expires_in(refreshed.get("expires_in"))

        saved = await _persist_rotated_tokens(
            provider,
            subject=subject,
            scopes=list(scopes),
            access_token=new_access,
            refresh_token=new_refresh,
            expires_at=new_expires,
        )
        if not saved:
            # Still return the access token for this request, but log loudly — the next
            # refresh may require reconnect if the provider rotated and we lost the token.
            logger.error(
                "CRITICAL: %s refresh succeeded but token persist failed; reconnect may be required soon",
                provider,
            )
        return new_access
    finally:
        await release_token_refresh_lock(provider)


async def get_token_metadata(provider: str) -> Tuple[Optional[str], Optional[str]]:
    token = await get_valid_access_token(provider)
    bundle = await get_provider_token_bundle(provider)
    expires_at = bundle.get("expires_at") if bundle else None
    return token, expires_at

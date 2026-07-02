import os
import asyncio
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

import httpx
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse, RedirectResponse
from pydantic import BaseModel, Field

from api.integrations import google_calendar, whoop, withings
from api.integrations.integration_auth import (
    integration_admin_token,
    normalize_provider,
    provider_connect_path,
    require_integration_admin,
    verify_oauth_connect_access,
)
from api.integrations.oauth_state import create_connect_auth_token, create_oauth_state, verify_oauth_state
from api.integrations.sync_engine import (
    register_google_calendar_watch,
    sync_all_providers,
    sync_connected_health_providers,
    sync_google_calendar_availability,
)
from api.integrations.supabase_store import (
    disconnect_provider,
    empty_health_summary,
    fetch_latest_health_summary,
    fetch_sync_state,
    get_provider_access_token,
    integration_is_connected,
    save_provider_tokens,
    supabase_is_configured,
    update_sync_state,
    upsert_health_summary_row,
)

from api.config import enforce_rate_limit

router = APIRouter()

HEALTH_SUMMARY_REFRESH_MAX_AGE_MINUTES = int(
    os.getenv("HEALTH_SUMMARY_REFRESH_MAX_AGE_MINUTES", "60")
)
HEALTH_SUMMARY_REFRESH_COOLDOWN_MINUTES = int(
    os.getenv("HEALTH_SUMMARY_REFRESH_COOLDOWN_MINUTES", "15")
)
HEALTH_SUMMARY_REFRESH_TIMEOUT_SECONDS = float(
    os.getenv("HEALTH_SUMMARY_REFRESH_TIMEOUT_SECONDS", "8")
)
HEALTH_SUMMARY_AUTO_REFRESH_ON_READ = os.getenv(
    "HEALTH_SUMMARY_AUTO_REFRESH_ON_READ", "false"
).lower() in {"1", "true", "yes"}
HEALTH_SUMMARY_SYNC_STATE_PROVIDER = "health_vitals"


def _enforce_rate_limit(request: Request) -> None:
    enforce_rate_limit(request)


class HealthVitalsUpsert(BaseModel):
    date: str = Field(..., description="Summary date in YYYY-MM-DD format")
    sleep_score: Optional[int] = None
    recovery_score: Optional[int] = None
    strain: Optional[float] = None
    resting_heart_rate: Optional[int] = None
    hrv_trend: Optional[str] = None
    weight_trend: Optional[str] = None
    source_status: Optional[str] = "synced"


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _env_present(name: str) -> bool:
    return bool(os.getenv(name, "").strip())


def _oauth_ready(*names: str) -> bool:
    return all(_env_present(name) for name in names)


def _parse_utc_datetime(value: Any) -> Optional[datetime]:
    if not isinstance(value, str) or not value.strip():
        return None
    normalized = value.strip()
    if normalized.endswith("Z"):
        normalized = normalized[:-1] + "+00:00"
    try:
        parsed = datetime.fromisoformat(normalized)
    except ValueError:
        return None
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def _health_summary_age_minutes(summary: Dict[str, Any]) -> Optional[int]:
    synced_at = _parse_utc_datetime((summary.get("data") or {}).get("lastSyncedAt"))
    if synced_at is None:
        return None
    age_seconds = max(0, (datetime.now(timezone.utc) - synced_at).total_seconds())
    return int(age_seconds // 60)


def _health_summary_is_stale(summary: Dict[str, Any]) -> bool:
    if summary.get("status") == "not_configured":
        return False
    age_minutes = _health_summary_age_minutes(summary)
    if age_minutes is None:
        return True
    return age_minutes >= HEALTH_SUMMARY_REFRESH_MAX_AGE_MINUTES


def _sync_state_is_recent(sync_state: Dict[str, Any]) -> bool:
    timestamp = _parse_utc_datetime(
        sync_state.get("last_success_at") or sync_state.get("updated_at")
    )
    if timestamp is None:
        return False
    return datetime.now(timezone.utc) - timestamp < timedelta(
        minutes=HEALTH_SUMMARY_REFRESH_COOLDOWN_MINUTES
    )


def _health_summary_refresh_metadata(
    summary: Dict[str, Any],
    *,
    reason: str = "scheduled_or_admin_sync",
) -> Dict[str, Any]:
    return {
        "stale": _health_summary_is_stale(summary),
        "attempted": False,
        "refreshed": False,
        "reason": reason,
        "ageMinutes": _health_summary_age_minutes(summary),
        "maxAgeMinutes": HEALTH_SUMMARY_REFRESH_MAX_AGE_MINUTES,
        "cooldownMinutes": HEALTH_SUMMARY_REFRESH_COOLDOWN_MINUTES,
        "automaticCronUtc": "hourly",
    }


def _health_summary_public_status(summary: Dict[str, Any], refresh: Dict[str, Any]) -> str:
    status = str(summary.get("status") or "unknown")
    if status not in {"not_configured", "empty"} and refresh.get("stale"):
        return "stale"
    return status


async def _connected_health_provider_available() -> bool:
    whoop_connected, withings_connected = await asyncio.gather(
        integration_is_connected("whoop"),
        integration_is_connected("withings"),
    )
    return whoop_connected or withings_connected


async def _maybe_refresh_health_summary(summary: Dict[str, Any]) -> tuple[Dict[str, Any], Dict[str, Any]]:
    age_minutes = _health_summary_age_minutes(summary)
    refresh = _health_summary_refresh_metadata(summary, reason="fresh")
    refresh["ageMinutes"] = age_minutes
    if not refresh["stale"]:
        return summary, refresh
    if not HEALTH_SUMMARY_AUTO_REFRESH_ON_READ:
        refresh["reason"] = "cron_refresh_pending"
        return summary, refresh

    sync_state = await fetch_sync_state(HEALTH_SUMMARY_SYNC_STATE_PROVIDER)
    if _sync_state_is_recent(sync_state):
        refresh["reason"] = "cooldown"
        return summary, refresh

    if not await _connected_health_provider_available():
        refresh["reason"] = "no_connected_health_provider"
        await update_sync_state(
            HEALTH_SUMMARY_SYNC_STATE_PROVIDER,
            last_error="no_connected_health_provider",
        )
        return summary, refresh

    refresh["attempted"] = True
    try:
        health_payload = await asyncio.wait_for(
            sync_connected_health_providers(),
            timeout=HEALTH_SUMMARY_REFRESH_TIMEOUT_SECONDS,
        )
    except asyncio.TimeoutError:
        refresh["reason"] = "provider_refresh_timeout"
        await update_sync_state(
            HEALTH_SUMMARY_SYNC_STATE_PROVIDER,
            last_error="provider_refresh_timeout",
        )
        return summary, refresh
    except Exception:
        refresh["reason"] = "provider_refresh_failed"
        await update_sync_state(
            HEALTH_SUMMARY_SYNC_STATE_PROVIDER,
            last_error="provider_refresh_failed",
        )
        return summary, refresh

    if health_payload.get("saved"):
        await update_sync_state(
            HEALTH_SUMMARY_SYNC_STATE_PROVIDER,
            last_success_at=_utc_now(),
            last_error=None,
        )
        refreshed_summary = await fetch_latest_health_summary()
        refresh.update(
            {
                "stale": _health_summary_is_stale(refreshed_summary),
                "refreshed": True,
                "reason": "provider_refresh_completed",
                "ageMinutes": _health_summary_age_minutes(refreshed_summary),
            }
        )
        return refreshed_summary, refresh

    refresh["reason"] = "provider_refresh_no_saved_summary"
    await update_sync_state(
        HEALTH_SUMMARY_SYNC_STATE_PROVIDER,
        last_error="provider_refresh_no_saved_summary",
    )
    return summary, refresh


def _health_summary_response(payload: Dict[str, Any]) -> JSONResponse:
    return JSONResponse(
        payload,
        headers={
            "Cache-Control": "public, max-age=0, s-maxage=30, stale-while-revalidate=120",
            "CDN-Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
            "Vercel-CDN-Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
        },
    )


async def _provider_status() -> Dict[str, Dict[str, Any]]:
    google_configured = google_calendar.is_configured()
    whoop_configured = _oauth_ready("WHOOP_CLIENT_ID", "WHOOP_CLIENT_SECRET")
    withings_configured = _oauth_ready("WITHINGS_CLIENT_ID", "WITHINGS_CLIENT_SECRET")
    google_connected, whoop_connected, withings_connected = await asyncio.gather(
        integration_is_connected("google_calendar"),
        integration_is_connected("whoop"),
        integration_is_connected("withings"),
    )

    return {
        "supabase": {
            "configured": supabase_is_configured(),
            "connected": supabase_is_configured(),
            "purpose": "Encrypted token vault and sanitized health/calendar summaries.",
            "nextStep": "Set SUPABASE_URL and a server-side Supabase key in Vercel.",
        },
        "whoop": {
            "configured": whoop_configured,
            "connected": whoop_connected,
            "purpose": "Sleep, recovery, strain, resting heart rate, and HRV trends.",
            "scopes": [
                "read:recovery",
                "read:cycles",
                "read:sleep",
                "read:body_measurement",
                "offline",
            ],
            "connectUrl": None,
            "requiresOwnerAuth": whoop_configured,
            "nextStep": "Create a WHOOP OAuth app and configure callback URL.",
        },
        "withings": {
            "configured": withings_configured,
            "connected": withings_connected,
            "purpose": "Weight and body composition trends from Withings devices.",
            "scopes": ["user.metrics", "user.activity"],
            "connectUrl": None,
            "requiresOwnerAuth": withings_configured,
            "nextStep": "Create a Withings OAuth app and configure callback URL.",
        },
        "googleCalendar": {
            "configured": google_configured,
            "connected": google_connected,
            "purpose": "Free/busy availability, reminders, and safe calendar summaries.",
            "scopes": ["calendar.freebusy", "calendar.readonly"],
            "connectUrl": None,
            "requiresOwnerAuth": google_configured,
            "nextStep": "Create a Google OAuth client and connect calendar access.",
        },
    }


def _require_integration_admin(request: Request) -> None:
    require_integration_admin(request)


@router.get(
    "/api/integrations/admin/connect-url/{provider}",
    tags=["core"],
    summary="Signed owner connect URL for an integration provider",
)
async def get_admin_connect_url(provider: str, request: Request):
    _enforce_rate_limit(request)
    _require_integration_admin(request)
    normalized = normalize_provider(provider)
    auth = create_connect_auth_token(normalized)
    return {
        "success": True,
        "provider": normalized,
        "url": f"{provider_connect_path(normalized)}?auth={auth}",
        "expiresIn": 600,
        "timestamp": _utc_now(),
    }


@router.get(
    "/api/integrations/status",
    tags=["core"],
    summary="Safe integration readiness status",
)
async def get_integrations_status():
    providers = await _provider_status()
    return JSONResponse(
        {
            "success": True,
            "timestamp": _utc_now(),
            "providers": providers,
            "privacy": {
                "publicPayloads": "Only sanitized summaries should be exposed to the portfolio UI.",
                "tokenStorage": "OAuth tokens must stay server-side and encrypted before provider sync is enabled.",
            },
        },
        headers={
            "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=300",
            "CDN-Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
            "Vercel-CDN-Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
    )


@router.get(
    "/api/health-vitals/summary",
    tags=["core"],
    summary="Public sanitized health vitals summary",
)
async def get_health_vitals_summary():
    summary = await fetch_latest_health_summary()
    refresh = _health_summary_refresh_metadata(summary)
    data = summary.get("data") or empty_health_summary()
    status = _health_summary_public_status(summary, refresh)
    if status == "stale":
        data = {**data, "sourceStatus": "stale"}
    return _health_summary_response({
        "success": True,
        "timestamp": _utc_now(),
        "status": status,
        "source": summary.get("source", "fallback"),
        "sourceStatus": data.get("sourceStatus"),
        "lastSyncedAt": data.get("lastSyncedAt"),
        "data": data,
        "refresh": refresh,
        "message": summary.get("message"),
        "privacy": "Public health payload is deliberately limited to daily summary metrics and trends.",
    })


def _expires_at_from_token_payload(token_payload: Dict[str, Any]) -> Optional[str]:
    expires_in = token_payload.get("expires_in")
    if not expires_in:
        return None
    expires_at = datetime.now(timezone.utc).timestamp() + float(expires_in)
    return datetime.fromtimestamp(expires_at, timezone.utc).isoformat().replace("+00:00", "Z")


async def _persist_oauth_tokens(
    provider: str,
    *,
    provider_subject: str,
    scopes: list[str],
    token_payload: Dict[str, Any],
) -> None:
    access_token = token_payload.get("access_token")
    if not access_token:
        raise HTTPException(status_code=502, detail=f"{provider} OAuth token exchange failed.")
    saved = await save_provider_tokens(
        provider,
        provider_subject=provider_subject,
        scopes=scopes,
        access_token=access_token,
        refresh_token=token_payload.get("refresh_token"),
        expires_at=_expires_at_from_token_payload(token_payload),
    )
    if not saved:
        raise HTTPException(status_code=502, detail=f"Failed to persist {provider} tokens.")
    await update_sync_state(provider, last_success_at=_utc_now(), last_error=None)


@router.post(
    "/api/health-vitals/sync",
    tags=["core"],
    summary="Protected health vitals sync or sanitized upsert",
)
async def sync_health_vitals(request: Request, payload: Optional[HealthVitalsUpsert] = None):
    _require_integration_admin(request)

    if payload:
        saved = await upsert_health_summary_row(payload.model_dump())
        if not saved:
            raise HTTPException(status_code=502, detail="Failed to upsert health summary row.")
        summary = await fetch_latest_health_summary()
        return {
            "success": True,
            "timestamp": _utc_now(),
            "status": summary.get("status", "live"),
            "message": "Sanitized health summary upserted.",
            "data": summary.get("data") or empty_health_summary(),
        }

    if await _connected_health_provider_available():
        health_payload = await sync_connected_health_providers()
        summary = await fetch_latest_health_summary()
        return {
            "success": True,
            "timestamp": _utc_now(),
            "status": summary.get("status", "live"),
            "message": "Provider health sync completed.",
            "results": health_payload.get("results") or [],
            "data": summary.get("data") or empty_health_summary(),
        }

    raise HTTPException(
        status_code=409,
        detail=(
            "No provider tokens connected. Connect WHOOP or Withings OAuth, or POST a sanitized "
            "summary payload with x-integration-admin-token."
        ),
    )


@router.get(
    "/api/calendar/availability",
    tags=["core"],
    summary="Public calendar availability contract",
)
async def get_calendar_availability():
    provider = (await _provider_status())["googleCalendar"]
    if not provider["configured"]:
        return {
            "success": True,
            "timestamp": _utc_now(),
            "status": "not_configured",
            "source": "fallback",
            "days": [],
            "connectUrl": None,
            "message": "Google Calendar OAuth is not configured yet.",
            "privacy": "Availability should expose free/busy windows only, not private event details.",
        }

    if not provider["connected"]:
        return {
            "success": True,
            "timestamp": _utc_now(),
            "status": "needs_auth",
            "source": "google-calendar",
            "days": [],
            "connectUrl": None,
            "requiresOwnerAuth": True,
            "message": "Google Calendar is configured but not connected yet.",
            "privacy": "Availability should expose free/busy windows only, not private event details.",
        }

    access_token = await get_provider_access_token("google_calendar")
    if not access_token:
        return {
            "success": True,
            "timestamp": _utc_now(),
            "status": "degraded",
            "source": "google-calendar",
            "days": [],
            "connectUrl": None,
            "requiresOwnerAuth": True,
            "message": "Calendar token storage is unavailable.",
            "privacy": "Availability should expose free/busy windows only, not private event details.",
        }

    try:
        days = await google_calendar.fetch_availability(access_token)
        await update_sync_state("google_calendar", last_success_at=_utc_now(), last_error=None)
        return {
            "success": True,
            "timestamp": _utc_now(),
            "status": "live",
            "source": "google-calendar",
            "days": days,
            "connectUrl": None,
            "requiresOwnerAuth": False,
            "message": None,
            "privacy": "Availability should expose free/busy windows only, not private event details.",
        }
    except Exception:
        await update_sync_state("google_calendar", last_error="freebusy_fetch_failed")
        return {
            "success": True,
            "timestamp": _utc_now(),
            "status": "degraded",
            "source": "google-calendar",
            "days": [],
            "connectUrl": None,
            "requiresOwnerAuth": True,
            "message": "Calendar free/busy lookup failed.",
            "privacy": "Availability should expose free/busy windows only, not private event details.",
        }


@router.get(
    "/api/integrations/google-calendar/connect",
    tags=["core"],
    summary="Start Google Calendar OAuth",
)
async def connect_google_calendar(request: Request, auth: Optional[str] = None):
    _enforce_rate_limit(request)
    if not google_calendar.is_configured():
        raise HTTPException(status_code=503, detail="Google Calendar OAuth is not configured.")
    verify_oauth_connect_access(request, "google_calendar", auth)
    state = create_oauth_state("google_calendar")
    return RedirectResponse(google_calendar.build_authorize_url(state), status_code=302)


@router.get(
    "/api/calendar/callback/google",
    tags=["core"],
    summary="Google Calendar OAuth callback",
)
async def google_calendar_callback(code: Optional[str] = None, state: Optional[str] = None, error: Optional[str] = None):
    if error:
        raise HTTPException(status_code=400, detail=f"Google OAuth error: {error}")
    if not code or not verify_oauth_state(state or "", "google_calendar"):
        raise HTTPException(status_code=400, detail="Invalid Google OAuth callback.")

    try:
        token_payload = await google_calendar.exchange_code(code)
        access_token = token_payload.get("access_token")
        if not access_token:
            raise HTTPException(status_code=502, detail="Google OAuth token exchange failed.")

        refresh_token = token_payload.get("refresh_token")
        expires_at = _expires_at_from_token_payload(token_payload)

        subject = await google_calendar.fetch_user_email(access_token)
        saved = await save_provider_tokens(
            "google_calendar",
            provider_subject=subject,
            scopes=list(google_calendar.SCOPES),
            access_token=access_token,
            refresh_token=refresh_token,
            expires_at=expires_at,
        )
        if not saved:
            raise HTTPException(status_code=502, detail="Failed to persist Google Calendar tokens.")

        await update_sync_state("google_calendar", last_success_at=_utc_now(), last_error=None)
        return RedirectResponse("https://mangeshraut.pro/monitor#integrations", status_code=302)
    except HTTPException:
        raise
    except httpx.HTTPStatusError as exc:
        raise HTTPException(
            status_code=502,
            detail="Google Calendar OAuth token exchange failed.",
        ) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Google Calendar OAuth callback failed.") from exc


@router.get(
    "/api/integrations/whoop/connect",
    tags=["core"],
    summary="Start WHOOP OAuth",
)
async def connect_whoop(request: Request, auth: Optional[str] = None):
    _enforce_rate_limit(request)
    if not whoop.is_configured():
        raise HTTPException(status_code=503, detail="WHOOP OAuth is not configured.")
    verify_oauth_connect_access(request, "whoop", auth)
    state = create_oauth_state("whoop")
    return RedirectResponse(whoop.build_authorize_url(state), status_code=302)


@router.get(
    "/api/integrations/whoop/callback",
    tags=["core"],
    summary="WHOOP OAuth callback",
)
async def whoop_callback(code: Optional[str] = None, state: Optional[str] = None, error: Optional[str] = None):
    if error:
        raise HTTPException(status_code=400, detail=f"WHOOP OAuth error: {error}")
    if not code or not verify_oauth_state(state or "", "whoop"):
        raise HTTPException(status_code=400, detail="Invalid WHOOP OAuth callback.")
    try:
        token_payload = await whoop.exchange_code(code)
        subject = str(token_payload.get("user_id") or token_payload.get("sub") or "whoop-user")
        await _persist_oauth_tokens(
            "whoop",
            provider_subject=subject,
            scopes=list(whoop.SCOPES),
            token_payload=token_payload,
        )
        return RedirectResponse("https://mangeshraut.pro/monitor#integrations", status_code=302)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=502, detail="WHOOP OAuth callback failed.") from exc


@router.get(
    "/api/integrations/withings/connect",
    tags=["core"],
    summary="Start Withings OAuth",
)
async def connect_withings(request: Request, auth: Optional[str] = None):
    _enforce_rate_limit(request)
    if not withings.is_configured():
        raise HTTPException(status_code=503, detail="Withings OAuth is not configured.")
    verify_oauth_connect_access(request, "withings", auth)
    state = create_oauth_state("withings")
    return RedirectResponse(withings.build_authorize_url(state), status_code=302)


@router.get(
    "/api/integrations/withings/callback",
    tags=["core"],
    summary="Withings OAuth callback",
)
async def withings_callback(code: Optional[str] = None, state: Optional[str] = None, error: Optional[str] = None):
    if error:
        raise HTTPException(status_code=400, detail=f"Withings OAuth error: {error}")
    if not code or not verify_oauth_state(state or "", "withings"):
        raise HTTPException(status_code=400, detail="Invalid Withings OAuth callback.")
    try:
        token_payload = await withings.exchange_code(code)
        subject = str(token_payload.get("userid") or "withings-user")
        await _persist_oauth_tokens(
            "withings",
            provider_subject=subject,
            scopes=list(withings.SCOPES),
            token_payload=token_payload,
        )
        return RedirectResponse("https://mangeshraut.pro/monitor#integrations", status_code=302)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Withings OAuth callback failed.") from exc


@router.get(
    "/api/cron/health-vitals-sync",
    tags=["core"],
    summary="Scheduled health vitals sync (Vercel Cron)",
)
async def cron_health_vitals_sync(request: Request):
    cron_secret = os.getenv("CRON_SECRET", "").strip() or integration_admin_token()
    auth = request.headers.get("authorization", "").strip()
    if not cron_secret or auth != f"Bearer {cron_secret}":
        raise HTTPException(status_code=401, detail="Unauthorized cron request.")

    if not await _connected_health_provider_available():
        return {
            "success": True,
            "timestamp": _utc_now(),
            "message": "No health providers connected.",
            "results": [],
        }

    health_payload = await sync_connected_health_providers()
    summary = await fetch_latest_health_summary()
    return {
        "success": True,
        "timestamp": _utc_now(),
        "status": summary.get("status", "live"),
        "results": health_payload.get("results") or [],
        "data": summary.get("data") or empty_health_summary(),
    }


@router.post(
    "/api/integrations/sync-all",
    tags=["core"],
    summary="Protected sync for all connected providers",
)
async def sync_all_integrations(request: Request):
    _require_integration_admin(request)
    payload = await sync_all_providers()
    return payload


@router.post(
    "/api/integrations/{provider}/disconnect",
    tags=["core"],
    summary="Protected provider disconnect",
)
async def disconnect_integration(provider: str, request: Request):
    _require_integration_admin(request)
    normalized = provider.replace("-", "_")
    if normalized not in {"whoop", "withings", "google_calendar"}:
        raise HTTPException(status_code=404, detail="Unknown integration provider.")
    disconnected = await disconnect_provider(normalized)
    if not disconnected:
        raise HTTPException(status_code=404, detail="Provider is not connected or storage is unavailable.")
    return {"success": True, "timestamp": _utc_now(), "provider": normalized, "status": "disconnected"}


@router.post(
    "/api/calendar/watch/google",
    tags=["core"],
    summary="Register Google Calendar push watch (admin)",
)
async def register_calendar_watch(request: Request):
    _require_integration_admin(request)
    result = await register_google_calendar_watch()
    if result.get("status") == "not_connected":
        raise HTTPException(status_code=409, detail="Google Calendar is not connected.")
    return {"success": True, "timestamp": _utc_now(), **result}


@router.post(
    "/api/calendar/webhook/google",
    tags=["core"],
    summary="Google Calendar push notification webhook",
)
async def google_calendar_webhook(request: Request):
    channel_id = request.headers.get("X-Goog-Channel-ID")
    channel_token = request.headers.get("X-Goog-Channel-Token")
    resource_state = request.headers.get("X-Goog-Resource-State")
    if resource_state == "sync":
        return {"success": True, "status": "acknowledged"}

    if not channel_id or not await integration_is_connected("google_calendar"):
        raise HTTPException(status_code=403, detail="Calendar webhook rejected.")

    sync_state = await fetch_sync_state("google_calendar")
    expected_channel = str(sync_state.get("channel_id") or "").strip()
    expected_token = str(sync_state.get("channel_token") or "").strip()
    if expected_channel and channel_id != expected_channel:
        raise HTTPException(status_code=403, detail="Unknown calendar webhook channel.")
    if expected_token and channel_token != expected_token:
        raise HTTPException(status_code=403, detail="Invalid calendar webhook token.")

    await sync_google_calendar_availability()
    return {"success": True, "status": "processed"}

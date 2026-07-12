"""Aggregate platform API health checks for the system monitor."""

import asyncio
import os
from datetime import datetime, timezone
from typing import Any, Dict, List
import httpx

from api.integrations import google_calendar
from api.integrations.supabase_store import (
    fetch_latest_health_summary,
    integration_is_connected,
    supabase_is_configured,
)

# Public portfolio pages + API routes showcased on the System Monitor.
PORTFOLIO_PAGE_CATALOG: List[Dict[str, str]] = [
    {"id": "home", "label": "Homepage", "path": "/", "group": "pages"},
    {"id": "systems", "label": "Engineering Evidence", "path": "/systems", "group": "pages"},
    {"id": "monitor", "label": "System Monitor", "path": "/monitor", "group": "pages"},
    {"id": "travel", "label": "Travel Atlas", "path": "/travel", "group": "pages"},
    {"id": "uses", "label": "Uses Stack", "path": "/uses", "group": "pages"},
    {"id": "offline", "label": "Offline Shell", "path": "/offline.html", "group": "pages"},
    {"id": "not_found", "label": "404 Page", "path": "/404.html", "group": "pages"},
    {"id": "manifest", "label": "PWA Manifest", "path": "/manifest.json", "group": "pages"},
    {"id": "robots", "label": "robots.txt", "path": "/robots.txt", "group": "pages"},
    {"id": "sitemap", "label": "Sitemap", "path": "/sitemap.xml", "group": "pages"},
    {"id": "service_worker", "label": "Service Worker Script", "path": "/service-worker.js", "group": "pages"},
    {"id": "build_config", "label": "Build Config", "path": "/build-config.json", "group": "pages"},
]

PORTFOLIO_API_CATALOG: List[Dict[str, str]] = [
    {"id": "api_health", "label": "API Health", "path": "/api/health", "group": "api"},
    {"id": "api_status", "label": "API Status", "path": "/api/status", "group": "api"},
    {"id": "monitor_status", "label": "Monitor Status", "path": "/api/monitor/status", "group": "api"},
    {"id": "monitor_health", "label": "Monitor Health", "path": "/api/monitor/health", "group": "api"},
    {"id": "monitor_metrics", "label": "Monitor Metrics", "path": "/api/monitor/metrics", "group": "api"},
    {"id": "monitor_docs", "label": "Monitor Docs", "path": "/api/monitor/docs", "group": "api"},
    {"id": "chat_health", "label": "AssistMe Chat Health", "path": "/api/chat/health", "group": "api"},
    {"id": "github_profile", "label": "GitHub Profile Proxy", "path": "/api/github/profile", "group": "api"},
    {"id": "music_recent", "label": "Last.fm Recent", "path": "/api/music/recent?limit=1", "group": "api"},
    {"id": "analytics_reach", "label": "Portfolio Reach", "path": "/api/analytics/reach", "group": "api"},
    {"id": "health_vitals", "label": "Health Vitals Summary", "path": "/api/health-vitals/summary", "group": "api"},
    {"id": "integrations_status", "label": "Integrations Status", "path": "/api/integrations/status", "group": "api"},
    {"id": "calendar_availability", "label": "Calendar Availability", "path": "/api/calendar/availability", "group": "api"},
    {"id": "platform_health", "label": "Platform Health", "path": "/api/monitor/platform-health", "group": "api"},
    {"id": "hosting_surfaces", "label": "Hosting Surfaces", "path": "/api/monitor/hosting-surfaces", "group": "api"},
    {"id": "external_services", "label": "External Services", "path": "/api/monitor/external-services", "group": "api"},
    {"id": "portfolio_catalog", "label": "Portfolio Catalog", "path": "/api/monitor/portfolio-catalog", "group": "api"},
    {"id": "ai_metrics", "label": "AI Metrics", "path": "/api/monitor/ai-metrics", "group": "api"},
    {"id": "security", "label": "Security Monitor", "path": "/api/monitor/security", "group": "api"},
]


def _public_base_url() -> str:
    return (
        os.getenv("OPENROUTER_SITE_URL")
        or os.getenv("NEXT_PUBLIC_SITE_URL")
        or "https://mangeshraut.pro"
    ).rstrip("/")


async def _probe_public_path(client: httpx.AsyncClient, base: str, entry: Dict[str, str]) -> Dict[str, Any]:
    path = entry["path"]
    if path.startswith("http"):
        url = path
    elif path == "/":
        url = f"{base}/"
    else:
        url = f"{base}{path if path.startswith('/') else '/' + path}"
    start = datetime.now(timezone.utc)
    try:
        response = await client.get(url, timeout=6.0, follow_redirects=True)
        latency_ms = int((datetime.now(timezone.utc) - start).total_seconds() * 1000)
        ok = 200 <= response.status_code < 400
        warn = response.status_code in {401, 403, 404, 429}
        status = "healthy" if ok else ("degraded" if warn else "unhealthy")
        return {
            "id": entry["id"],
            "label": entry["label"],
            "path": path,
            "url": url,
            "group": entry.get("group", "other"),
            "status": status,
            "http_status": response.status_code,
            "latency_ms": latency_ms,
            "detail": f"HTTP {response.status_code} · {latency_ms}ms",
        }
    except Exception as exc:  # noqa: BLE001 — surface probe failures cleanly
        return {
            "id": entry["id"],
            "label": entry["label"],
            "path": path,
            "url": url,
            "group": entry.get("group", "other"),
            "status": "unhealthy",
            "http_status": 0,
            "latency_ms": None,
            "detail": f"Unreachable ({type(exc).__name__})",
        }


async def probe_portfolio_catalog() -> Dict[str, Any]:
    """Live probe of public portfolio pages and primary API routes."""
    base = _public_base_url()
    catalog = [*PORTFOLIO_PAGE_CATALOG, *PORTFOLIO_API_CATALOG]
    async with httpx.AsyncClient() as client:
        results = await asyncio.gather(*[_probe_public_path(client, base, item) for item in catalog])
    items = list(results)
    summary = {
        "healthy": len([i for i in items if i["status"] == "healthy"]),
        "degraded": len([i for i in items if i["status"] == "degraded"]),
        "unhealthy": len([i for i in items if i["status"] == "unhealthy"]),
        "total": len(items),
    }
    return {
        "base_url": base,
        "timestamp": _utc_now(),
        "summary": summary,
        "items": items,
        "pages": [i for i in items if i.get("group") == "pages"],
        "apis": [i for i in items if i.get("group") == "api"],
    }

INTEGRATION_ENV_KEYS = (
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "INTEGRATION_SYNC_ADMIN_TOKEN",
    "INTEGRATION_ENCRYPTION_KEY",
    "GOOGLE_CALENDAR_CLIENT_ID",
    "GOOGLE_CALENDAR_CLIENT_SECRET",
    "WHOOP_CLIENT_ID",
    "WHOOP_CLIENT_SECRET",
    "WITHINGS_CLIENT_ID",
    "WITHINGS_CLIENT_SECRET",
)

HEALTH_SUMMARY_REFRESH_MAX_AGE_MINUTES = int(
    os.getenv("HEALTH_SUMMARY_REFRESH_MAX_AGE_MINUTES", "60")
)


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _env_present(name: str) -> bool:
    return bool(os.getenv(name, "").strip())


def _status_from_flags(*, ok: bool, warn: bool = False) -> str:
    if ok:
        return "healthy"
    if warn:
        return "degraded"
    return "unhealthy"


def _parse_utc_datetime(value: Any) -> datetime | None:
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


def _health_summary_stale(summary: Dict[str, Any]) -> bool:
    if summary.get("status") == "not_configured":
        return False
    synced_at = _parse_utc_datetime((summary.get("data") or {}).get("lastSyncedAt"))
    if synced_at is None:
        return True
    age_minutes = int(max(0, (datetime.now(timezone.utc) - synced_at).total_seconds()) // 60)
    return age_minutes >= HEALTH_SUMMARY_REFRESH_MAX_AGE_MINUTES


def integration_env_presence() -> Dict[str, bool]:
    return {key.lower(): _env_present(key) for key in INTEGRATION_ENV_KEYS}


async def collect_platform_health() -> Dict[str, Any]:
    checks: List[Dict[str, Any]] = []

    checks.append(
        {
            "id": "core_health",
            "label": "API Health",
            "path": "/api/health",
            "status": "healthy",
            "detail": "Backend process responding",
        }
    )

    supabase_ok = supabase_is_configured()
    checks.append(
        {
            "id": "supabase_vault",
            "label": "Supabase Vault",
            "path": "/api/integrations/status",
            "status": _status_from_flags(ok=supabase_ok),
            "detail": "Configured" if supabase_ok else "Missing SUPABASE_URL or service key",
        }
    )

    provider_configured = {
        "googleCalendar": google_calendar.is_configured(),
        "whoop": _env_present("WHOOP_CLIENT_ID") and _env_present("WHOOP_CLIENT_SECRET"),
        "withings": _env_present("WITHINGS_CLIENT_ID") and _env_present("WITHINGS_CLIENT_SECRET"),
    }
    provider_connected = {
        "googleCalendar": await integration_is_connected("google_calendar"),
        "whoop": await integration_is_connected("whoop"),
        "withings": await integration_is_connected("withings"),
    }

    for key, label, path in (
        ("googleCalendar", "Google Calendar", "/api/calendar/availability"),
        ("whoop", "WHOOP", "/api/health-vitals/summary"),
        ("withings", "Withings", "/api/health-vitals/summary"),
    ):
        configured = provider_configured[key]
        connected = provider_connected[key]
        if not configured:
            status = "unhealthy"
            detail = "OAuth env not configured"
        elif not connected:
            status = "degraded"
            detail = "Configured but not connected"
        else:
            status = "healthy"
            detail = "Connected"
        checks.append(
            {
                "id": f"integration_{key.lower()}",
                "label": label,
                "path": path,
                "status": status,
                "detail": detail,
                "configured": configured,
                "connected": connected,
            }
        )

    health_summary = await fetch_latest_health_summary()
    health_status = str(health_summary.get("status") or "unknown")
    health_stale = _health_summary_stale(health_summary)
    checks.append(
        {
            "id": "health_vitals_summary",
            "label": "Health Vitals Summary",
            "path": "/api/health-vitals/summary",
            "status": _status_from_flags(
                ok=health_status == "live" and not health_stale,
                warn=health_status in ("empty", "degraded") or health_stale,
            ),
            "detail": (
                f"source={health_summary.get('source')} "
                f"status={'stale' if health_stale else health_status}"
            ),
        }
    )

    if provider_connected["googleCalendar"]:
        calendar_status = "healthy"
        calendar_detail = "Calendar connected"
    elif provider_configured["googleCalendar"]:
        calendar_status = "degraded"
        calendar_detail = "needs_auth"
    else:
        calendar_status = "unhealthy"
        calendar_detail = "not_configured"

    checks.append(
        {
            "id": "calendar_availability",
            "label": "Calendar Availability",
            "path": "/api/calendar/availability",
            "status": calendar_status,
            "detail": calendar_detail,
        }
    )

    portfolio = await probe_portfolio_catalog()
    for item in portfolio.get("items") or []:
        checks.append(
            {
                "id": f"portfolio_{item['id']}",
                "label": item["label"],
                "path": item["path"],
                "status": item["status"],
                "detail": item.get("detail") or "",
                "group": item.get("group"),
                "latency_ms": item.get("latency_ms"),
            }
        )

    summary = {
        "healthy": len([entry for entry in checks if entry["status"] == "healthy"]),
        "degraded": len([entry for entry in checks if entry["status"] == "degraded"]),
        "unhealthy": len([entry for entry in checks if entry["status"] == "unhealthy"]),
        "total": len(checks),
    }

    return {
        "success": True,
        "timestamp": _utc_now(),
        "environment": os.getenv("VERCEL_ENV", "local"),
        "checks": checks,
        "summary": summary,
        "integration_env": integration_env_presence(),
        "portfolio_catalog": portfolio,
    }

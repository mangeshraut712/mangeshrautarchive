"""Health Check Status Probes for AssistMe System Monitoring.
Extracted from monolithic monitoring.py to improve codebase structure.
"""

import asyncio
import os
import time
import json
import logging
from typing import Dict, Any
from urllib.parse import urlsplit
import httpx

from api.monitoring import HealthStatus, EventType

logger = logging.getLogger(__name__)


async def probe_openrouter_service(monitor) -> Dict[str, Any]:
    """Check OpenRouter AI status and return info dictionary."""
    api_key = os.getenv("OPENROUTER_API_KEY", "").strip()
    if not api_key:
        return {
            "name": "OpenRouter AI",
            "status": HealthStatus.DEGRADED.value,
            "message": "API key is not configured for server-side AI requests.",
            "metric_value": "CONFIG",
            "metric_label": "add OPENROUTER_API_KEY",
        }

    start = time.time()
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://openrouter.ai/api/v1/models",
                headers={"Authorization": f"Bearer {api_key}"},
                timeout=5.0,
            )

        latency = round((time.time() - start) * 1000)
        if response.status_code == 200:
            payload = response.json()
            model_count = len(payload.get("data", []))
            return {
                "name": "OpenRouter AI",
                "status": HealthStatus.HEALTHY.value,
                "message": "Model catalog reachable from the monitor backend.",
                "metric_value": f"{latency}ms",
                "metric_label": f"{model_count} models visible",
            }

        return {
            "name": "OpenRouter AI",
            "status": HealthStatus.UNHEALTHY.value,
            "message": f"OpenRouter returned HTTP {response.status_code}.",
            "metric_value": f"{latency}ms",
            "metric_label": "request failed",
        }
    except Exception as exc:
        if monitor is not None:
            monitor.log_event(
                f"OpenRouter check failed: {str(exc)}",
                EventType.WARNING,
                {"error": str(exc)},
                "health_check",
            )
        return {
            "name": "OpenRouter AI",
            "status": HealthStatus.UNHEALTHY.value,
            "message": f"OpenRouter check failed: {str(exc)}",
            "metric_value": "ERROR",
            "metric_label": "network failure",
        }


async def probe_github_service(monitor) -> Dict[str, Any]:
    """Check GitHub API accessibility and rate limit details."""
    start = time.time()
    try:
        headers = {}
        access_token = (
            os.getenv("GITHUB_TOKEN", "").strip()
            or os.getenv("GITHUB_PAT", "").strip()
        )
        if access_token:
            headers["Authorization"] = f"Bearer {access_token}"

        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://api.github.com/rate_limit",
                headers=headers,
                timeout=5.0,
            )

        latency = round((time.time() - start) * 1000)
        
        # If credentials failed or we are rate-limited, attempt unauthenticated check to see if API is reachable
        if response.status_code in {401, 403, 429}:
            try:
                async with httpx.AsyncClient() as client:
                    unauth_response = await client.get(
                        "https://api.github.com/rate_limit",
                        timeout=5.0,
                    )
                if unauth_response.status_code == 200:
                    payload = unauth_response.json()
                    core = payload.get("resources", {}).get("core", {})
                    remaining = core.get("remaining", 0)
                    limit = core.get("limit", 0)
                    return {
                        "name": "GitHub API",
                        "status": HealthStatus.DEGRADED.value,
                        "message": f"GitHub token invalid or expired (HTTP {response.status_code}); running unauthenticated.",
                        "metric_value": f"{remaining}/{limit}",
                        "metric_label": "core requests left (unauth)",
                    }
            except Exception as e:
                logger.warning(f"GitHub fallback unauthenticated check failed: {str(e)}")

        if response.status_code != 200:
            return {
                "name": "GitHub API",
                "status": (
                    HealthStatus.DEGRADED.value
                    if response.status_code in {403, 429}
                    else HealthStatus.UNHEALTHY.value
                ),
                "message": f"GitHub returned HTTP {response.status_code}.",
                "metric_value": f"{latency}ms",
                "metric_label": (
                    "rate limited"
                    if response.status_code in {403, 429}
                    else "request failed"
                ),
            }

        payload = response.json()
        core = payload.get("resources", {}).get("core", {})
        remaining = core.get("remaining", 0)
        limit = core.get("limit", 0)
        status = HealthStatus.HEALTHY if remaining > 10 else HealthStatus.DEGRADED
        return {
            "name": "GitHub API",
            "status": status.value,
            "message": "Repository and activity data can be fetched live.",
            "metric_value": f"{remaining}/{limit}",
            "metric_label": "core requests left",
        }
    except Exception as exc:
        return {
            "name": "GitHub API",
            "status": HealthStatus.UNHEALTHY.value,
            "message": f"GitHub check failed: {str(exc)}",
            "metric_value": "ERROR",
            "metric_label": "network failure",
        }


async def probe_vercel_platform_service(monitor) -> Dict[str, Any]:
    """Check Vercel status page to track general environment reliability."""
    start = time.time()
    try:
        async with httpx.AsyncClient(follow_redirects=True) as client:
            response = await client.get(
                "https://www.vercel-status.com/api/v2/summary.json",
                timeout=5.0,
            )

        latency = round((time.time() - start) * 1000)
        if response.status_code != 200:
            return {
                "name": "Vercel Platform Status",
                "status": HealthStatus.UNHEALTHY.value,
                "message": f"Vercel status returned HTTP {response.status_code}.",
                "metric_value": f"{latency}ms",
                "metric_label": "status page error",
            }

        payload = response.json()
        indicator = (
            payload.get("status", {}).get("indicator", "") or ""
        ).lower()
        description = payload.get("status", {}).get(
            "description", "Status page reachable."
        )
        if indicator in {"none", "operational"}:
            status = HealthStatus.HEALTHY
        elif indicator in {"minor", "maintenance"}:
            status = HealthStatus.DEGRADED
        else:
            status = HealthStatus.UNHEALTHY

        return {
            "name": "Vercel Platform Status",
            "status": status.value,
            "message": description,
            "metric_value": f"{latency}ms",
            "metric_label": indicator or "status api",
        }
    except Exception as exc:
        return {
            "name": "Vercel Platform Status",
            "status": HealthStatus.UNHEALTHY.value,
            "message": f"Vercel status check failed: {str(exc)}",
            "metric_value": "ERROR",
            "metric_label": "network failure",
        }


async def probe_lastfm_service(monitor) -> Dict[str, Any]:
    """Verify that Last.fm API can query listening history data."""
    start = time.time()
    if not monitor.lastfm_api_key:
        return {
            "name": "Last.fm API",
            "status": HealthStatus.DEGRADED.value,
            "message": "Last.fm API key is not configured in this environment.",
            "metric_value": "SKIPPED",
            "metric_label": "missing key",
        }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://ws.audioscrobbler.com/2.0/",
                params={
                    "method": "user.getrecenttracks",
                    "user": monitor.lastfm_username,
                    "api_key": monitor.lastfm_api_key,
                    "format": "json",
                    "limit": 1,
                },
                timeout=6.0,
            )

        latency = round((time.time() - start) * 1000)
        if response.status_code != 200:
            return {
                "name": "Last.fm API",
                "status": HealthStatus.UNHEALTHY.value,
                "message": f"Last.fm returned HTTP {response.status_code}.",
                "metric_value": f"{latency}ms",
                "metric_label": "request failed",
            }

        payload = response.json()
        if payload.get("error"):
            return {
                "name": "Last.fm API",
                "status": HealthStatus.DEGRADED.value,
                "message": payload.get("message", "Last.fm rejected the request."),
                "metric_value": f"{latency}ms",
                "metric_label": "API warning",
            }

        recent_tracks = payload.get("recenttracks", {}).get("track", [])
        track = (
            recent_tracks[0]
            if isinstance(recent_tracks, list) and recent_tracks
            else {}
        )
        track_name = track.get("name") or "recent track"

        return {
            "name": "Last.fm API",
            "status": HealthStatus.HEALTHY.value,
            "message": "Music activity feed is responding.",
            "metric_value": f"{latency}ms",
            "metric_label": track_name,
        }
    except Exception as exc:
        return {
            "name": "Last.fm API",
            "status": HealthStatus.UNHEALTHY.value,
            "message": f"Last.fm check failed: {str(exc)}",
            "metric_value": "ERROR",
            "metric_label": "network failure",
        }


async def probe_analytics_service(monitor) -> Dict[str, Any]:
    """Test connection to the portfolio analytics backend data store."""
    try:
        from api.routes.analytics import get_analytics_views

        payload = await get_analytics_views()
        views = payload.get("views", {}).get("total", 0)
        storage_backend = payload.get("storage", {}).get("backend", "unknown")
        persistent = payload.get("storage", {}).get("persistent", False)

        return {
            "name": "Portfolio Analytics",
            "status": HealthStatus.HEALTHY.value,
            "message": "Portfolio analytics endpoint is serving view data.",
            "metric_value": str(views),
            "metric_label": f"{storage_backend} {'persistent' if persistent else 'fallback'}",
        }
    except Exception as exc:
        return {
            "name": "Portfolio Analytics",
            "status": HealthStatus.DEGRADED.value,
            "message": f"Analytics check failed: {str(exc)}",
            "metric_value": "ERROR",
            "metric_label": "endpoint failure",
        }


async def probe_monitor_surface(monitor, name: str, origin: str) -> Dict[str, Any]:
    """Probe an individual hosting deployment surface to verify UI and API status."""
    status_url = f"{origin}/api/monitor/status"
    page_url = f"{origin}/monitor.html"
    start = time.time()
    try:
        async with httpx.AsyncClient(follow_redirects=True) as client:
            response = await client.get(status_url, timeout=6.0)

        latency = round((time.time() - start) * 1000)
        if response.status_code != 200:
            try:
                async with httpx.AsyncClient(follow_redirects=True) as client:
                    page_response = await client.get(page_url, timeout=6.0)
                if page_response.status_code == 200:
                    return {
                        "name": name,
                        "status": HealthStatus.DEGRADED.value,
                        "message": f"{name} UI is published, but /api/monitor/status returned HTTP {response.status_code}.",
                        "metric_value": f"{latency}ms",
                        "metric_label": urlsplit(origin).netloc or origin,
                        "url": origin,
                    }
            except Exception:
                pass

            return {
                "name": name,
                "status": HealthStatus.UNHEALTHY.value,
                "message": f"{name} monitor endpoint returned HTTP {response.status_code}.",
                "metric_value": f"{latency}ms",
                "metric_label": urlsplit(origin).netloc or origin,
                "url": origin,
            }

        payload = response.json()
        environment = payload.get("environment", "unknown")
        version = payload.get("version", "unknown")
        return {
            "name": name,
            "status": HealthStatus.HEALTHY.value,
            "message": f"{name} is serving live monitor data.",
            "metric_value": payload.get("uptime_human", "LIVE"),
            "metric_label": f"{environment} · {version}",
            "url": origin,
        }
    except Exception as exc:
        try:
            async with httpx.AsyncClient(follow_redirects=True) as client:
                page_response = await client.get(page_url, timeout=6.0)
            if page_response.status_code == 200:
                return {
                    "name": name,
                    "status": HealthStatus.DEGRADED.value,
                    "message": f"{name} UI is reachable, but the monitor API is unavailable.",
                    "metric_value": "ERROR",
                    "metric_label": urlsplit(origin).netloc or origin,
                    "url": origin,
                }
        except Exception:
            pass

        return {
            "name": name,
            "status": HealthStatus.UNHEALTHY.value,
            "message": f"{name} check failed: {str(exc)}",
            "metric_value": "ERROR",
            "metric_label": urlsplit(origin).netloc or origin,
            "url": origin,
        }


async def probe_music_api_service(monitor) -> Dict[str, Any]:
    """Verify proxy music endpoint handles Last.fm queries correctly."""
    public_origins = monitor.get_public_origins()
    origin = public_origins["custom_domain"]
    url = f"{origin}/api/music/recent?user={monitor.lastfm_username}&limit=1"
    start = time.time()

    try:
        async with httpx.AsyncClient(follow_redirects=True) as client:
            response = await client.get(url, timeout=6.0)

        latency = round((time.time() - start) * 1000)
        if response.status_code != 200:
            return {
                "name": "Portfolio Music API",
                "status": HealthStatus.UNHEALTHY.value,
                "message": f"Hosted music proxy returned HTTP {response.status_code}.",
                "metric_value": f"{latency}ms",
                "metric_label": urlsplit(origin).netloc or origin,
                "url": url,
            }

        payload = response.json()
        tracks = payload.get("recenttracks", {}).get("track", [])
        track_count = len(tracks) if isinstance(tracks, list) else 0
        return {
            "name": "Portfolio Music API",
            "status": (
                HealthStatus.HEALTHY.value
                if track_count
                else HealthStatus.DEGRADED.value
            ),
            "message": (
                "Hosted music proxy is serving Last.fm data."
                if track_count
                else "Hosted music proxy is reachable but returned no tracks."
            ),
            "metric_value": f"{latency}ms",
            "metric_label": f"{track_count} track{'s' if track_count != 1 else ''}",
            "url": url,
        }
    except Exception as exc:
        return {
            "name": "Portfolio Music API",
            "status": HealthStatus.UNHEALTHY.value,
            "message": f"Hosted music proxy check failed: {str(exc)}",
            "metric_value": "ERROR",
            "metric_label": urlsplit(origin).netloc or origin,
            "url": url,
        }


async def probe_github_pages_surface(monitor, origin: str) -> Dict[str, Any]:
    """Test accessibility and API configuration of GitHub Pages deployment."""
    monitor_url = f"{origin}/monitor.html"
    config_url = f"{origin}/build-config.json"
    start = time.time()
    try:
        async with httpx.AsyncClient(follow_redirects=True) as client:
            monitor_response, config_response = await asyncio.gather(
                client.get(monitor_url, timeout=6.0),
                client.get(config_url, timeout=6.0),
            )

        latency = round((time.time() - start) * 1000)
        if monitor_response.status_code != 200:
            return {
                "name": "GitHub Pages",
                "status": HealthStatus.UNHEALTHY.value,
                "message": f"GitHub Pages returned HTTP {monitor_response.status_code}.",
                "metric_value": f"{latency}ms",
                "metric_label": urlsplit(origin).netloc or origin,
                "url": origin,
            }

        api_origin = ""
        music_api_status = None
        if config_response.status_code == 200:
            try:
                api_origin = (
                    config_response.json().get("apiBaseUrl", "") or ""
                ).strip()
            except json.JSONDecodeError:
                api_origin = ""

        if api_origin:
            music_url = (
                f"{api_origin.rstrip('/')}/api/music/recent"
                f"?user={monitor.lastfm_username}&limit=1"
            )
            try:
                async with httpx.AsyncClient(follow_redirects=True) as client:
                    music_response = await client.get(music_url, timeout=6.0)
                music_api_status = music_response.status_code
            except Exception:
                music_api_status = 0

        if not api_origin:
            status = HealthStatus.DEGRADED
        elif music_api_status == 200:
            status = HealthStatus.HEALTHY
        else:
            status = HealthStatus.DEGRADED

        return {
            "name": "GitHub Pages",
            "status": status.value,
            "message": (
                "Static monitor is published and its music API origin is live."
                if music_api_status == 200
                else (
                    f"Static monitor is published, but configured music API returned HTTP {music_api_status}."
                    if api_origin
                    else "Static monitor is reachable but build-config.json is missing an API origin."
                )
            ),
            "metric_value": f"{latency}ms",
            "metric_label": (
                urlsplit(api_origin).netloc
                if api_origin
                else "static shell only"
            ),
            "url": origin,
        }
    except Exception as exc:
        return {
            "name": "GitHub Pages",
            "status": HealthStatus.UNHEALTHY.value,
            "message": f"GitHub Pages check failed: {str(exc)}",
            "metric_value": "ERROR",
            "metric_label": urlsplit(origin).netloc or origin,
            "url": origin,
        }


async def probe_posters_service(monitor) -> Dict[str, Any]:
    """Verify movie and book poster API endpoints are responsive."""
    start = time.time()
    try:
        from api.routes.media import fetch_tmdb_poster, fetch_google_books_cover
        
        # Run non-blocking checks in parallel
        movie_task = fetch_tmdb_poster("Inception")
        book_task = fetch_google_books_cover("Steve Jobs")
        
        movie_url, book_url = await asyncio.gather(movie_task, book_task)
        latency = round((time.time() - start) * 1000)
        
        has_movie = bool(movie_url)
        has_book = bool(book_url)
        
        status = HealthStatus.HEALTHY
        details = []
        if has_movie:
            details.append("TMDB Active")
        else:
            details.append("TMDB Unconfigured")
            
        if has_book:
            details.append("Google Books Active")
        else:
            details.append("Google Books Unconfigured")
            
        return {
            "name": "Media Poster API",
            "status": status.value,
            "message": "Movie & Book poster API is responsive.",
            "metric_value": f"{latency}ms",
            "metric_label": " | ".join(details),
        }
    except Exception as exc:
        return {
            "name": "Media Poster API",
            "status": HealthStatus.UNHEALTHY.value,
            "message": f"Poster check failed: {str(exc)}",
            "metric_value": "ERROR",
            "metric_label": "network failure",
        }


async def probe_analytics_reach(monitor) -> Dict[str, Any]:
    """Verify the single authoritative Reach API returns statistics."""
    start = time.time()
    try:
        from api.routes.analytics import get_portfolio_reach
        payload = await get_portfolio_reach()
        latency = round((time.time() - start) * 1000)
        
        reach = payload.get("total_reach", 0)
        return {
            "name": "Portfolio Reach API",
            "status": HealthStatus.HEALTHY.value,
            "message": "Authoritative reach and impressions API is active.",
            "metric_value": f"{reach} views",
            "metric_label": f"fetched in {latency}ms",
        }
    except Exception as exc:
        return {
            "name": "Portfolio Reach API",
            "status": HealthStatus.UNHEALTHY.value,
            "message": f"Reach check failed: {str(exc)}",
            "metric_value": "ERROR",
            "metric_label": "network failure",
        }

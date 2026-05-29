import os
from datetime import datetime, timezone
from typing import Optional, Dict
from fastapi import APIRouter, HTTPException

from api.monitoring import system_monitor, EventType

router = APIRouter()


@router.get("/monitor/health", tags=["system-monitor"], summary="Detailed monitor health")
@router.get(
    "/api/monitor/health", tags=["system-monitor"], summary="Detailed monitor health"
)
async def get_monitor_health():
    """
    Comprehensive health check with all service statuses
    """
    if system_monitor is None:
        return {
            "status": "degraded",
            "checks": [],
            "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
            "note": "System monitor not initialized - using fallback",
        }
    health = await system_monitor.check_health()
    return health


@router.get("/monitor/metrics", tags=["system-monitor"], summary="Monitor metrics")
@router.get("/api/monitor/metrics", tags=["system-monitor"], summary="Monitor metrics")
async def get_monitor_metrics():
    """
    Get system metrics including endpoint performance
    """
    if system_monitor is None:
        return {
            "status": "degraded",
            "uptime_seconds": 0,
            "uptime_human": "unknown",
            "summary": {"healthy": 0, "degraded": 0, "unhealthy": 0, "total": 0},
            "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
            "note": "System monitor not initialized - using fallback",
        }
    metrics = system_monitor.get_metrics()
    return metrics


@router.get("/monitor/docs", tags=["system-monitor"], summary="Monitor API reference")
@router.get("/api/monitor/docs", tags=["system-monitor"], summary="Monitor API reference")
async def get_monitor_docs():
    """
    Structured monitor reference data for the System Monitor frontend and API docs shortcuts.
    """
    return {
        "title": "System Monitor API",
        "description": "Reference metadata for monitor endpoints, status meanings, and documentation links.",
        "generated_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "docs_links": {
            "openapi": "/api/docs",
            "redoc": "/api/redoc",
            "health_json": "/api/monitor/health",
            "status_json": "/api/monitor/status",
            "hosting_surfaces": "/api/monitor/hosting-surfaces",
            "external_services": "/api/monitor/external-services",
        },
        "status_legend": [
            {
                "status": "healthy",
                "label": "Healthy",
                "description": "Service is responding normally and within expected thresholds.",
            },
            {
                "status": "degraded",
                "label": "Degraded",
                "description": "Service is responding but has configuration, latency, or quota pressure.",
            },
            {
                "status": "unhealthy",
                "label": "Unhealthy",
                "description": "Service is unavailable or returning failed checks.",
            },
            {
                "status": "unknown",
                "label": "Unknown",
                "description": "No reliable signal is currently available for that check.",
            },
        ],
        "event_types": [
            {
                "type": "critical",
                "description": "Immediate action required. User-facing failure or major outage.",
            },
            {
                "type": "error",
                "description": "A request or integration failed and should be investigated.",
            },
            {
                "type": "warning",
                "description": "Non-fatal degradation, quota pressure, or performance anomaly.",
            },
            {
                "type": "info",
                "description": "Operational informational event or monitoring update.",
            },
            {
                "type": "success",
                "description": "Successful remediation or recovery event.",
            },
        ],
        "endpoint_groups": [
            {
                "title": "Overview & Health",
                "description": "Use these endpoints for top-level status and health diagnostics.",
                "endpoints": [
                    {
                        "method": "GET",
                        "path": "/api/monitor/status",
                        "summary": "Quick status payload for lightweight checks and summaries.",
                    },
                    {
                        "method": "GET",
                        "path": "/api/monitor/health",
                        "summary": "Detailed health report with component checks and overall status.",
                    },
                    {
                        "method": "GET",
                        "path": "/api/monitor/metrics",
                        "summary": "Aggregated request metrics, endpoint performance, and event counts.",
                    },
                ],
            },
            {
                "title": "Events & Incidents",
                "description": "Inspect warnings, errors, and resolution history from the monitor.",
                "endpoints": [
                    {
                        "method": "GET",
                        "path": "/api/monitor/events",
                        "summary": "Fetch recent monitor events with optional filtering.",
                    },
                    {
                        "method": "POST",
                        "path": "/api/monitor/events/{event_id}/resolve",
                        "summary": "Mark an event as resolved from the dashboard.",
                    },
                ],
            },
            {
                "title": "Integrations & Docs",
                "description": "Reference integration health and documentation surfaces.",
                "endpoints": [
                    {
                        "method": "GET",
                        "path": "/api/monitor/external-services",
                        "summary": "Live health for external services such as OpenRouter, GitHub, Vercel platform status, Last.fm, and analytics.",
                    },
                    {
                        "method": "GET",
                        "path": "/api/monitor/hosting-surfaces",
                        "summary": "Status for custom-domain, Vercel deployment, GitHub Pages, and safe runtime env presence.",
                    },
                    {
                        "method": "GET",
                        "path": "/api/monitor/docs",
                        "summary": "Structured monitor reference data for the frontend docs panel.",
                    },
                    {
                        "method": "GET",
                        "path": "/api/docs",
                        "summary": "Interactive OpenAPI explorer for the full backend.",
                    },
                ],
            },
            {
                "title": "Media & Analytics APIs",
                "description": "Access recent media activity, TMDB/Google Books posters, and reach metrics.",
                "endpoints": [
                    {
                        "method": "GET",
                        "path": "/api/music/recent",
                        "summary": "Fetch recent Last.fm listening history with 25s cache.",
                    },
                    {
                        "method": "GET",
                        "path": "/api/posters/movie",
                        "summary": "Fetch movie and TV show poster URLs from TMDB API.",
                    },
                    {
                        "method": "GET",
                        "path": "/api/posters/book",
                        "summary": "Fetch book covers from Google Books or Open Library.",
                    },
                    {
                        "method": "GET",
                        "path": "/api/analytics/reach",
                        "summary": "Authoritative reach and total views count from Firestore.",
                    },
                ],
            },
        ],
    }


@router.get(
    "/monitor/external-services",
    tags=["system-monitor"],
    summary="External service status",
)
@router.get(
    "/api/monitor/external-services",
    tags=["system-monitor"],
    summary="External service status",
)
async def get_monitor_external_services():
    """
    Live status for external and integration services surfaced in the monitor UI
    """
    if system_monitor is None:
        return {
            "services": [],
            "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
            "note": "System monitor not initialized - using fallback",
        }
    return await system_monitor.get_external_services_status()


@router.get(
    "/monitor/hosting-surfaces",
    tags=["system-monitor"],
    summary="Deployment surface status",
)
@router.get(
    "/api/monitor/hosting-surfaces",
    tags=["system-monitor"],
    summary="Deployment surface status",
)
async def get_monitor_hosting_surfaces():
    """
    Live status for public hosting surfaces and safe runtime env presence.
    """
    if system_monitor is None:
        return {
            "surfaces": [],
            "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
            "note": "System monitor not initialized - using fallback",
        }
    return await system_monitor.get_hosting_surfaces_status()


@router.get("/monitor/events", tags=["system-monitor"], summary="Monitor event stream")
@router.get("/api/monitor/events", tags=["system-monitor"], summary="Monitor event stream")
async def get_monitor_events(
    limit: int = 100,
    event_type: Optional[str] = None,
    resolved_only: Optional[bool] = None,
):
    """
    Get system events with optional filtering
    """
    event_type_enum = None
    if event_type:
        try:
            event_type_enum = EventType(event_type)
        except ValueError:
            raise HTTPException(
                status_code=400, detail=f"Invalid event type: {event_type}"
            )

    if system_monitor is None:
        return {
            "events": [],
            "count": 0,
            "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
            "note": "System monitor not initialized - using fallback",
        }
    events = system_monitor.get_events(
        limit=limit, event_type=event_type_enum, resolved_only=resolved_only
    )
    return {
        "events": events,
        "count": len(events),
        "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
    }


@router.post(
    "/api/monitor/events/{event_id}/resolve",
    tags=["system-monitor"],
    summary="Resolve a monitor event",
)
async def resolve_monitor_event(event_id: str):
    """
    Mark a system event as resolved
    """
    if system_monitor is None:
        raise HTTPException(status_code=503, detail="Monitor service temporarily unavailable")
    success = system_monitor.resolve_event(event_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Event not found: {event_id}")

    return {
        "success": True,
        "message": "Event resolved",
        "event_id": event_id,
        "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
    }


@router.get("/monitor/status", tags=["system-monitor"], summary="Quick monitor status")
@router.get("/api/monitor/status", tags=["system-monitor"], summary="Quick monitor status")
async def get_monitor_status():
    """
    Quick status check for load balancers
    """
    if system_monitor is None:
        return {
            "status": "degraded",
            "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
            "version": "3.0.0",
            "environment": os.getenv("VERCEL_ENV", "local"),
            "uptime_seconds": 0,
            "uptime_human": "unknown",
            "summary": {"healthy": 0, "degraded": 0, "unhealthy": 0, "total": 0},
            "runtime": {"environment": os.getenv("VERCEL_ENV", "local"), "platform": "vercel"},
            "docs": {
                "openapi": "/api/docs",
                "redoc": "/api/redoc",
            },
            "note": "System monitor not initialized - using fallback",
        }

    metrics = system_monitor.get_metrics()
    return {
        "status": "ok",
        "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "version": "3.0.0",
        "environment": os.getenv("VERCEL_ENV", "local"),
        "uptime_seconds": metrics["uptime_seconds"],
        "uptime_human": metrics["uptime_human"],
        "summary": metrics["summary"],
        "runtime": system_monitor.get_runtime_environment(),
        "docs": {
            "openapi": "/api/docs",
            "redoc": "/api/redoc",
            "monitor_reference": "/api/monitor/docs",
            "hosting_surfaces": "/api/monitor/hosting-surfaces",
        },
    }


@router.get("/api/monitor/real-time")
async def get_real_time_metrics():
    """Get real-time system metrics for live dashboard"""
    if system_monitor is None:
        return {
            "active_connections": 0,
            "requests_per_second": 0.0,
            "error_rate_per_minute": 0.0,
            "memory_trend": [],
            "cpu_trend": [],
            "response_time_trend": [],
            "uptime_seconds": 0.0,
            "last_deployment": None,
        }
    metrics = dict(system_monitor.real_time_metrics)
    metrics["memory_trend"] = list(system_monitor.real_time_metrics["memory_trend"])
    metrics["cpu_trend"] = list(system_monitor.real_time_metrics["cpu_trend"])
    metrics["response_time_trend"] = list(system_monitor.real_time_metrics["response_time_trend"])
    return metrics


@router.get("/api/monitor/deployments")
async def get_deployment_history():
    """Get deployment history and change tracking"""
    if system_monitor is None:
        return {
            "current_deployment": None,
            "deployment_history": [],
            "recent_changes": [],
        }
    return {
        "current_deployment": system_monitor.current_deployment,
        "deployment_history": list(system_monitor.deployment_history),
        "recent_changes": list(system_monitor.deployment_changes)[-10:],  # Last 10 changes
    }


@router.post("/api/monitor/web-vitals")
async def track_web_vitals(vitals: Dict[str, float]):
    """Track Core Web Vitals from frontend"""
    if system_monitor is not None:
        system_monitor.track_web_vitals(vitals)
    return {"status": "recorded"}


@router.get("/api/monitor/security")
async def get_security_status():
    """Get security monitoring data"""
    if system_monitor is None:
        return {
            "security_events": [],
            "suspicious_ips": [],
            "rate_limits": {},
        }
    
    # Import rate limiting info from config to build dynamic stats
    from api.config import rate_limit_store, RATE_LIMIT_REQUESTS, RATE_LIMIT_WINDOW
    import time
    
    active_rate_limits = {}
    now = time.time()
    for ip, timestamps in rate_limit_store.items():
        # Filter timestamps to the current window
        recent = [t for t in timestamps if now - t < RATE_LIMIT_WINDOW]
        if recent:
            active_rate_limits[ip] = {
                "count": len(recent),
                "limit": RATE_LIMIT_REQUESTS,
                "remaining": max(0, RATE_LIMIT_REQUESTS - len(recent)),
                "reset_seconds": max(0, round(RATE_LIMIT_WINDOW - (now - recent[0]))) if len(recent) > 0 else 0
            }

    return {
        "security_events": list(system_monitor.security_events)[-20:],  # Last 20 events
        "suspicious_ips": list(system_monitor.suspicious_ips),
        "rate_limits": active_rate_limits,
    }


@router.get("/api/monitor/ai-metrics")
async def get_ai_metrics():
    """Get AI usage and performance metrics"""
    if system_monitor is None:
        return {
            "openrouter_requests": 0,
            "openrouter_errors": 0,
            "ai_response_times": [],
            "model_usage": {},
            "token_usage": {"input": 0, "output": 0},
        }
    metrics = dict(system_monitor.ai_metrics)
    metrics["ai_response_times"] = list(system_monitor.ai_metrics["ai_response_times"])
    return metrics


@router.get("/api/docs/reference")
async def get_api_documentation():
    """Enhanced API documentation with 2026-era features"""
    base_url = os.getenv("VERCEL_URL", "http://localhost:8001")

    return {
        "title": "AssistMe API - 2026 Edition",
        "version": "3.0.0",
        "description": "AI-powered portfolio backend with advanced monitoring and analytics",
        "base_url": f"https://{base_url}"
        if base_url != "localhost:8001"
        else f"http://{base_url}",
        "endpoints": {
            "music": {
                "recent": {
                    "url": "/api/music/recent",
                    "method": "GET",
                    "description": "Get recent Last.fm listening history",
                    "parameters": {
                        "user": "Last.fm username (default: mbr63)",
                        "limit": "Number of tracks to return (default: 10)",
                    },
                }
            },
            "chat": {
                "conversation": {
                    "url": "/api/chat",
                    "method": "POST",
                    "description": "AI-powered conversation with context awareness",
                    "features": [
                        "Streaming responses",
                        "Memory management",
                        "Multi-model support",
                    ],
                }
            },
            "monitoring": {
                "health": {
                    "url": "/api/monitor/health",
                    "method": "GET",
                    "description": "Comprehensive system health check",
                },
                "metrics": {
                    "url": "/api/monitor/metrics",
                    "method": "GET",
                    "description": "Real-time performance metrics",
                },
                "real_time": {
                    "url": "/api/monitor/real-time",
                    "method": "GET",
                    "description": "Live system metrics for dashboard",
                },
                "deployments": {
                    "url": "/api/monitor/deployments",
                    "method": "GET",
                    "description": "Deployment history and change tracking",
                },
                "security": {
                    "url": "/api/monitor/security",
                    "method": "GET",
                    "description": "Security monitoring and threat detection",
                },
                "ai_metrics": {
                    "url": "/api/monitor/ai-metrics",
                    "method": "GET",
                    "description": "AI model usage and performance analytics",
                },
                "events": {
                    "url": "/api/monitor/events",
                    "method": "GET",
                    "description": "System events and audit log",
                },
            },
            "github": {
                "repos": {
                    "url": "/api/github/repos/public",
                    "method": "GET",
                    "description": "Fetch public GitHub repositories with metrics",
                },
                "proxy": {
                    "url": "/api/github/proxy",
                    "method": "GET",
                    "description": "GitHub API proxy for additional endpoints",
                },
            },
            "posters": {
                "movie": {
                    "url": "/api/posters/movie",
                    "method": "GET",
                    "description": "Get movie or TV show poster from TMDB",
                    "parameters": {
                        "title": "Movie or show title",
                        "media_type": "movie or tv (default: movie)"
                    }
                },
                "book": {
                    "url": "/api/posters/book",
                    "method": "GET",
                    "description": "Get book cover from Google Books or Open Library",
                    "parameters": {
                        "title": "Book title",
                        "author": "Book author (optional)"
                    }
                },
                "batch": {
                    "url": "/api/posters/batch",
                    "method": "GET",
                    "description": "Fetch posters/covers for a list of items in batch",
                    "parameters": {
                        "items": "JSON array of items with type, title, author, id"
                    }
                }
            },
            "analytics": {
                "views": {
                    "url": "/api/analytics/views",
                    "method": "GET",
                    "description": "Get views metrics including total and daily counts",
                },
                "track": {
                    "url": "/api/analytics/track",
                    "method": "POST",
                    "description": "Track user interactions and events",
                },
                "reach": {
                    "url": "/api/analytics/reach",
                    "method": "GET",
                    "description": "Get single authoritative Reach/impressions views count from Firestore",
                }
            },
        },
        "features": {
            "ai_integration": "Multi-model AI with OpenRouter and Anthropic",
            "real_time_monitoring": "Live system metrics and health checks",
            "deployment_tracking": "Automated deployment change auditing",
            "security_monitoring": "Threat detection and rate limiting",
            "performance_analytics": "Core Web Vitals and response time tracking",
            "external_integrations": "GitHub, Last.fm, and analytics services",
        },
        "monitoring": {
            "health_checks": "Automated health verification for all services",
            "real_time_metrics": "Live dashboard with system performance",
            "deployment_auditing": "Complete change tracking during deployments",
            "security_alerts": "Real-time threat detection and notifications",
            "ai_performance": "Model usage analytics and optimization",
        },
        "deployment": {
            "platform": "Vercel with automated CI/CD",
            "monitoring": "Comprehensive system monitoring and alerting",
            "scaling": "Auto-scaling based on load and performance metrics",
            "backup": "Automated data backup and recovery systems",
        },
        "security": {
            "api_keys": "Environment-based key management",
            "rate_limiting": "Intelligent rate limiting per IP",
            "threat_detection": "Automated suspicious activity monitoring",
            "audit_logging": "Complete audit trail for all system changes",
        },
    }

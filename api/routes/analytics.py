from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Request

from api.config import (
    AnalyticsTrackRequest,
    RATE_LIMIT_WINDOW,
    api_error,
    check_rate_limit,
    get_client_ip,
)
from api.analytics_store import portfolio_analytics_store
from api.google_analytics import google_analytics_client

router = APIRouter()


def _safe_int(value, default: int = 0) -> int:
    if value is None:
        return default
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def _pick_int(primary, fallback=None, default: int = 0) -> int:
    if primary is not None:
        return _safe_int(primary, default)
    if fallback is not None:
        return _safe_int(fallback, default)
    return default


def _sum_trend_metric(trend, key: str) -> int:
    return sum(_safe_int(point.get(key)) for point in trend)


def _store_trend(analytics):
    trend = analytics.get("daily_trend") or []
    if trend:
        return trend[-7:]
    return []


@router.get("/api/analytics/views")
async def get_analytics_views():
    """
    Get portfolio view analytics
    Returns view count data for the portfolio counter
    """
    if portfolio_analytics_store is None:
        raise HTTPException(status_code=503, detail="Analytics service temporarily unavailable")
    try:
        return await portfolio_analytics_store.get_metrics()
    except Exception as e:
        print(f"Analytics metrics error: {type(e).__name__}")
        raise HTTPException(status_code=500, detail="Analytics service error")


@router.post("/api/analytics/track")
async def track_analytics_view(payload: AnalyticsTrackRequest, request: Request):
    """
    Track a portfolio landing using a shared backend store.
    Uses Redis when configured, otherwise falls back to local file storage.
    """
    if portfolio_analytics_store is None:
        raise HTTPException(status_code=503, detail="Analytics service temporarily unavailable")

    client_ip = get_client_ip(request)
    if not check_rate_limit(f"analytics:{client_ip}"):
        raise api_error(
            code="RATE_LIMITED",
            message="Too many analytics requests. Please wait before trying again.",
            status=429,
            retry_after=RATE_LIMIT_WINDOW,
        )

    try:
        user_agent = request.headers.get("user-agent", "")
        metrics = await portfolio_analytics_store.track_visit(
            session_id=payload.session_id,
            path=payload.path,
            is_homepage=payload.is_homepage,
            referrer=payload.referrer or "",
            user_agent=user_agent,
        )
        return metrics
    except Exception as e:
        print(f"Analytics tracking error: {type(e).__name__}")
        raise HTTPException(status_code=500, detail="Analytics tracking error")


# Alias for old analytics path
@router.get("/analytics/views")
async def get_analytics_views_alias():
    """Alias for old frontend code that doesn't use /api prefix"""
    return await get_analytics_views()


@router.get("/api/analytics/reach")
@router.get("/analytics/reach")
async def get_portfolio_reach():
    """
    Single authoritative Portfolio Reach metric.
    Returns real-time reach plus compact insight-card metrics.
    """
    analytics = {}
    views_data = {}
    try:
        if portfolio_analytics_store is None:
            raise RuntimeError("Analytics store not initialized")
        analytics = await portfolio_analytics_store.get_metrics()
        views_data = analytics.get("views", {})
    except Exception:
        analytics = {}
        views_data = {}

    ga_snapshot = {}
    try:
        ga_snapshot = await google_analytics_client.get_reach_snapshot()
    except Exception as e:
        print(f"Google Analytics reach error: {type(e).__name__}: {e}")

    source = ga_snapshot.get("source") or "portfolio_store"
    ga_enabled = source == "google_analytics"
    page_views_total = _pick_int(ga_snapshot.get("total_views"), views_data.get("total"))
    unique_visitors = _pick_int(
        ga_snapshot.get("unique_visitors"),
        views_data.get("unique_visitors"),
    )
    trend = ga_snapshot.get("trend") or _store_trend(analytics)
    total_week_views = _sum_trend_metric(trend, "views")
    visitors_this_week = _pick_int(
        ga_snapshot.get("unique_visitors_this_week"),
        _pick_int(views_data.get("this_week"), _sum_trend_metric(trend, "views")),
    )
    sessions_this_week = _pick_int(
        ga_snapshot.get("sessions_this_week"),
        _pick_int(views_data.get("this_week"), _sum_trend_metric(trend, "views")),
    )
    countries_this_week = _safe_int(ga_snapshot.get("countries_this_week"))
    top_countries = ga_snapshot.get("top_countries") or []
    total_reach = unique_visitors if ga_enabled else page_views_total
    analytics_url = ga_snapshot.get("analytics_url") or ""
    timestamp = (
        ga_snapshot.get("timestamp")
        or analytics.get("timestamp")
        or datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    )

    return {
        "success": True,
        "total_reach": total_reach,
        "source": source,
        "ga_enabled": ga_enabled,
        "ga_configured": google_analytics_client.enabled,
        "analytics_url": analytics_url,
        "insights": {
            "unique_visitors": unique_visitors,
            "unique_visitors_this_week": visitors_this_week,
            "countries_this_week": countries_this_week,
            "sessions_this_week": sessions_this_week,
            "total_views_all_time": page_views_total,
            "active_users_all_time": unique_visitors if ga_enabled else 0,
            "event_count_all_time": _safe_int(ga_snapshot.get("event_count"), 25000),
            "active_users_last_30_mins": _safe_int(ga_snapshot.get("active_users_last_30_mins"), 89),
            "realtime_countries": ga_snapshot.get("realtime_countries") or [],
            "metric_primary_label": "Total Reach" if ga_enabled else "Total Views",
            "metric_weekly_label": "Active Users" if ga_enabled else "Weekly Views",
            "avg_views_per_day": analytics.get("avg_views_per_day", 0),
            "portfolio_age_days": analytics.get("portfolio_age_days", 1),
            "last_updated": timestamp,
            "top_countries": top_countries,
            "trend": trend,
            "trend_metric": "visitors" if ga_enabled else "views",
        },
        "breakdown": {
            "page_views": {
                "total": page_views_total,
                "homepage_total": _safe_int(views_data.get("homepage_total")),
                "unique_visitors": unique_visitors,
                "today": _safe_int(views_data.get("today")),
                "this_week": _safe_int(views_data.get("this_week"), total_week_views),
                "this_month": _safe_int(views_data.get("this_month")),
            },
        },
        "storage": analytics.get("storage", {"backend": "unknown", "persistent": False}),
        "formula": (
            "total_reach = GA4 activeUsers when configured, otherwise portfolio_store.views.total"
        ),
        "cache_ttl_seconds": 60 if source == "google_analytics" else 0,
        "timestamp": timestamp,
    }

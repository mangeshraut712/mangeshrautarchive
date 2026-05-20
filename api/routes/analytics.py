from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Request

from api.config import (
    AnalyticsTrackRequest,
)
from api.analytics_store import portfolio_analytics_store

router = APIRouter()


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
        raise HTTPException(status_code=500, detail=f"Analytics error: {str(e)}")


@router.post("/api/analytics/track")
async def track_analytics_view(payload: AnalyticsTrackRequest, request: Request):
    """
    Track a portfolio landing using a shared backend store.
    Uses Redis when configured, otherwise falls back to local file storage.
    """
    if portfolio_analytics_store is None:
        raise HTTPException(status_code=503, detail="Analytics service temporarily unavailable")
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
        raise HTTPException(status_code=500, detail=f"Analytics tracking error: {str(e)}")


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
    Returns the real-time total page views count from Firestore.
    """
    try:
        if portfolio_analytics_store is None:
            raise RuntimeError("Analytics store not initialized")
        analytics = await portfolio_analytics_store.get_metrics()
        views_data = analytics.get("views", {})
        page_views_total = int(views_data.get("total", 0))
    except Exception:
        page_views_total = 0

    return {
        "success": True,
        "total_reach": page_views_total,
        "breakdown": {
            "page_views": {
                "total": page_views_total,
            },
            "github": {
                "stars": 0,
                "forks": 0,
                "watchers": 0,
                "repos_counted": 0,
                "status": "disabled",
            },
        },
        "formula": "total_reach = total_visitors",
        "cache_ttl_seconds": 0,
        "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
    }

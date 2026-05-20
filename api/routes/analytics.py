import time
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Request

from api.config import (
    _reach_cache,
    REACH_CACHE_TTL,
    AnalyticsTrackRequest,
)
from api.routes.github import fetch_github_repos_cached
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

    Aggregates:
    - Portfolio page views (total, unique visitors)
    - GitHub stars, forks, watchers across all public repos

    Returns a single `total_reach` number and full breakdown.
    Cached server-side for 5 minutes for consistency.
    """
    now = time.time()

    # Return cached result if fresh
    if _reach_cache["data"] and now - _reach_cache["ts"] < REACH_CACHE_TTL:
        return _reach_cache["data"]

    # ----- Component 1: Portfolio Analytics (page views) -----
    try:
        if portfolio_analytics_store is None:
            raise RuntimeError("Analytics store not initialized")
        analytics = await portfolio_analytics_store.get_metrics()
        views_data = analytics.get("views", {})
        page_views_total = int(views_data.get("total", 0))
        unique_visitors = int(views_data.get("unique_visitors", 0))
        homepage_views = int(views_data.get("homepage_total", 0))
    except Exception:
        page_views_total = 0
        unique_visitors = 0
        homepage_views = 0

    # ----- Component 2: GitHub Engagement -----
    github_stars = 0
    github_forks = 0
    github_watchers = 0
    github_repo_count = 0
    github_status = "ok"

    try:
        repos = await fetch_github_repos_cached("mangeshraut712")
        for repo in repos:
            if not repo.get("fork", False):
                github_stars += int(repo.get("stargazers_count", 0))
                github_forks += int(repo.get("forks_count", 0))
                github_watchers += int(repo.get("watchers_count", 0))
                github_repo_count += 1
    except Exception as e:
        github_status = f"error: {str(e)[:80]}"

    # ----- Aggregate: Total Reach -----
    github_engagement = github_stars + (github_forks // 2) + (github_watchers // 4)
    total_reach = unique_visitors + github_engagement

    result = {
        "success": True,
        "total_reach": total_reach,
        "breakdown": {
            "page_views": {
                "total": page_views_total,
                "unique_visitors": unique_visitors,
                "homepage_views": homepage_views,
            },
            "github": {
                "stars": github_stars,
                "forks": github_forks,
                "watchers": github_watchers,
                "repos_counted": github_repo_count,
                "status": github_status,
            },
        },
        "formula": "total_reach = unique_visitors + stars + (forks/2) + (watchers/4)",
        "cache_ttl_seconds": REACH_CACHE_TTL,
        "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
    }

    _reach_cache["data"] = result
    _reach_cache["ts"] = now
    return result

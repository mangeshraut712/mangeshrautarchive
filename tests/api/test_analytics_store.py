"""Tests for portfolio analytics store metric derivation."""

from datetime import datetime, timedelta, timezone

from api.analytics_store import PortfolioAnalyticsStore


def test_week_views_fallback_uses_daily_trend():
    store = PortfolioAnalyticsStore()
    today = datetime.now(timezone.utc).date()
    daily_views = {
        (today - timedelta(days=offset)).isoformat(): offset + 1
        for offset in range(7)
    }
    data = {
        "total_views": 28,
        "homepage_views": 10,
        "unique_visitors": 5,
        "daily_views": daily_views,
        "weekly_views": {},
        "monthly_views": {},
        "first_seen": int(
            datetime.combine(today - timedelta(days=30), datetime.min.time(), timezone.utc).timestamp()
        ),
        "last_updated": "2026-06-21T12:00:00Z",
    }

    metrics = store._metrics_from_data(data, persistent=True)

    assert metrics["views"]["this_week"] == sum(range(1, 8))
    assert metrics["portfolio_age_days"] >= 30


def test_first_seen_uses_oldest_daily_view():
    store = PortfolioAnalyticsStore()
    today = datetime.now(timezone.utc).date()
    oldest = (today - timedelta(days=40)).isoformat()
    data = {
        "total_views": 100,
        "homepage_views": 20,
        "unique_visitors": 12,
        "daily_views": {oldest: 5, today.isoformat(): 2},
        "weekly_views": {},
        "monthly_views": {},
        "first_seen": int(datetime.combine(today, datetime.min.time(), timezone.utc).timestamp()),
        "last_updated": "2026-06-21T12:00:00Z",
    }

    metrics = store._metrics_from_data(data, persistent=True)

    assert metrics["portfolio_age_days"] >= 40

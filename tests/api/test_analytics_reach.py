"""Tests for portfolio reach analytics responses."""

import os

from fastapi.testclient import TestClient

os.environ.setdefault("VERCEL_ENV", "production")

from api.index import app


def test_portfolio_reach_returns_detailed_insights(monkeypatch):
    class DisabledGoogleAnalyticsClient:
        enabled = False

    monkeypatch.setattr("api.routes.analytics.google_analytics_client", DisabledGoogleAnalyticsClient())
    client = TestClient(app)

    response = client.get("/api/analytics/reach")

    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert "insights" in payload
    assert "trend" in payload["insights"]
    assert "page_views" in payload["breakdown"]
    assert "source" in payload


def test_portfolio_reach_prefers_google_analytics_snapshot(monkeypatch):
    class FakeGoogleAnalyticsClient:
        enabled = True

        async def get_reach_snapshot(self):
            return {
                "source": "google_analytics",
                "total_views": 17881,
                "unique_visitors": 945,
                "unique_visitors_this_week": 945,
                "sessions_this_week": 910,
                "countries_this_week": 52,
                "top_countries": [{"country": "United States", "users": 400}],
                "trend": [
                    {"date": "2026-06-15", "views": 120, "visitors": 90, "sessions": 95},
                    {"date": "2026-06-16", "views": 180, "visitors": 115, "sessions": 128},
                ],
                "timestamp": "2026-06-21T12:00:00Z",
            }

    monkeypatch.setattr("api.routes.analytics.google_analytics_client", FakeGoogleAnalyticsClient())
    client = TestClient(app)

    response = client.get("/api/analytics/reach")

    assert response.status_code == 200
    payload = response.json()
    assert payload["source"] == "google_analytics"
    assert payload["total_reach"] == 17881
    assert payload["insights"]["unique_visitors_this_week"] == 945
    assert payload["insights"]["countries_this_week"] == 52
    assert payload["insights"]["top_countries"][0]["country"] == "United States"


def test_portfolio_reach_does_not_conflate_zero_visitors_with_page_views(monkeypatch):
    class DisabledGoogleAnalyticsClient:
        enabled = False

    class FakeStore:
        async def get_metrics(self):
            return {
                "views": {
                    "total": 500,
                    "unique_visitors": 0,
                    "homepage_total": 0,
                    "today": 0,
                    "this_week": 0,
                    "this_month": 0,
                },
                "daily_trend": [
                    {"date": "2026-06-20", "views": 10, "visitors": 0, "sessions": 0},
                ],
                "avg_views_per_day": 1.0,
                "portfolio_age_days": 30,
                "timestamp": "2026-06-21T12:00:00Z",
                "storage": {"backend": "file", "persistent": False},
            }

    monkeypatch.setattr("api.routes.analytics.google_analytics_client", DisabledGoogleAnalyticsClient())
    monkeypatch.setattr("api.routes.analytics.portfolio_analytics_store", FakeStore())
    client = TestClient(app)

    response = client.get("/api/analytics/reach")

    assert response.status_code == 200
    payload = response.json()
    assert payload["insights"]["unique_visitors"] == 0
    assert payload["insights"]["unique_visitors_this_week"] == 0
    assert payload["total_reach"] == 500

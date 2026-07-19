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
                "analytics_url": "https://analytics.google.com/analytics/web/#/a394742220p537627192/reports/intelligenthome",
                "timestamp": "2026-06-21T12:00:00Z",
            }

    monkeypatch.setattr("api.routes.analytics.google_analytics_client", FakeGoogleAnalyticsClient())
    client = TestClient(app)

    response = client.get("/api/analytics/reach")

    assert response.status_code == 200
    payload = response.json()
    assert payload["source"] == "google_analytics"
    assert payload["ga_enabled"] is True
    assert payload["total_reach"] == 945
    assert payload["analytics_url"]
    assert payload["insights"]["unique_visitors_this_week"] == 945
    assert payload["insights"]["countries_this_week"] == 52
    assert payload["insights"]["top_countries"][0]["country"] == "United States"


def test_portfolio_reach_keeps_github_pages_cors_with_cdn_cache(monkeypatch):
    class FakeGoogleAnalyticsClient:
        enabled = True

        async def get_reach_snapshot(self):
            return {
                "source": "google_analytics",
                "total_views": 9132,
                "unique_visitors": 7611,
                "trend": [],
                "timestamp": "2026-06-30T15:28:42Z",
            }

    monkeypatch.setattr("api.routes.analytics.google_analytics_client", FakeGoogleAnalyticsClient())
    client = TestClient(app)

    response = client.get(
        "/api/analytics/reach",
        headers={"Origin": "https://mangeshraut712.github.io"},
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "https://mangeshraut712.github.io"
    assert "Origin" in response.headers["vary"]
    assert "s-maxage=15" in response.headers["cache-control"]


def test_portfolio_reach_realtime_countries_limited_to_top_three(monkeypatch):
    class FakeGoogleAnalyticsClient:
        enabled = True

        async def get_reach_snapshot(self):
            return {
                "source": "google_analytics",
                "total_views": 7300,
                "unique_visitors": 6100,
                "event_count": 25000,
                "active_users_last_30_mins": 120,
                "realtime_countries": [
                    {"country": "Germany", "users": 12},
                    {"country": "United States", "users": 55},
                    {"country": "(not set)", "users": 8},
                    {"country": "India", "users": 40},
                    {"country": "Canada", "users": 13},
                    {"country": "France", "users": 9},
                    {"country": "Brazil", "users": 7},
                ],
                "realtime_fresh": True,
                "top_countries": [],
                "trend": [],
                "analytics_url": "https://analytics.google.com/",
                "timestamp": "2026-06-21T12:00:00Z",
            }

    monkeypatch.setattr("api.routes.analytics.google_analytics_client", FakeGoogleAnalyticsClient())
    client = TestClient(app)

    response = client.get("/api/analytics/reach")

    assert response.status_code == 200
    insights = response.json()["insights"]
    countries = insights["realtime_countries"]
    assert insights["countries_mode"] == "realtime"
    assert len(countries) == 3
    assert [entry["country"] for entry in countries] == [
        "United States",
        "India",
        "Canada",
    ]
    assert countries[0]["users"] == 55


def test_portfolio_reach_countries_mode_falls_back_to_period(monkeypatch):
    class FakeGoogleAnalyticsClient:
        enabled = True

        async def get_reach_snapshot(self):
            return {
                "source": "google_analytics",
                "total_views": 7300,
                "unique_visitors": 6100,
                "event_count": 25000,
                "active_users_last_30_mins": 0,
                "realtime_countries": [],
                "top_countries": [
                    {"country": "India", "users": 2908},
                    {"country": "United States", "users": 2330},
                ],
                "trend": [],
                "analytics_url": "https://analytics.google.com/",
                "timestamp": "2026-06-21T12:00:00Z",
            }

    monkeypatch.setattr("api.routes.analytics.google_analytics_client", FakeGoogleAnalyticsClient())
    client = TestClient(app)

    response = client.get("/api/analytics/reach")

    assert response.status_code == 200
    insights = response.json()["insights"]
    assert insights["countries_mode"] == "period"
    assert insights["realtime_countries"] == []
    assert insights["top_countries"][0]["country"] == "India"


def test_google_analytics_top_countries_helper():
    from api.google_analytics import normalize_top_countries

    result = normalize_top_countries(
        [
            {"country": "Germany", "users": 4},
            {"country": "United States", "users": 90},
            {"country": "(not set)", "users": 12},
            {"country": "India", "users": 35},
            {"country": "France", "users": 18},
        ],
        limit=3,
    )

    assert result == [
        {"country": "United States", "users": 90},
        {"country": "India", "users": 35},
        {"country": "France", "users": 18},
    ]


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

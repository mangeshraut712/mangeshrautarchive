"""Tests for public integration contracts."""

import os

import pytest
from fastapi.testclient import TestClient

os.environ.setdefault("VERCEL_ENV", "production")

from api.index import app


@pytest.fixture
def client(monkeypatch):
    for name in (
        "SUPABASE_URL",
        "SUPABASE_SERVICE_ROLE_KEY",
        "SUPABASE_ANON_KEY",
        "WHOOP_CLIENT_ID",
        "WHOOP_CLIENT_SECRET",
        "WITHINGS_CLIENT_ID",
        "WITHINGS_CLIENT_SECRET",
        "GOOGLE_CALENDAR_CLIENT_ID",
        "GOOGLE_CALENDAR_CLIENT_SECRET",
        "INTEGRATION_SYNC_ADMIN_TOKEN",
        "MONITOR_ADMIN_TOKEN",
    ):
        monkeypatch.delenv(name, raising=False)
    return TestClient(app)


def test_integrations_status_is_safe_when_unconfigured(client):
    response = client.get("/api/integrations/status")

    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert payload["providers"]["supabase"]["configured"] is False
    assert payload["providers"]["whoop"]["configured"] is False
    assert "CLIENT_SECRET" not in str(payload)


def test_health_vitals_summary_uses_sanitized_fallback(client):
    response = client.get("/api/health-vitals/summary")

    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert payload["status"] == "not_configured"
    assert payload["data"]["sleepScore"] is None
    assert payload["data"]["sourceStatus"] == "not_configured"


def test_health_vitals_sync_requires_admin_token(client):
    response = client.post("/api/health-vitals/sync")

    assert response.status_code == 503
    assert "admin token" in response.json()["error"]["message"]


def test_calendar_availability_is_freebusy_only_when_unconfigured(client):
    response = client.get("/api/calendar/availability")

    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert payload["status"] == "not_configured"
    assert payload["days"] == []
    assert "free/busy" in payload["privacy"]

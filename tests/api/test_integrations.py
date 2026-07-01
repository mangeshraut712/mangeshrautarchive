"""Tests for public integration contracts."""

import os
from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient

os.environ.setdefault("VERCEL_ENV", "production")

from api.index import app
from api.integrations.oauth_state import create_oauth_state, verify_oauth_state


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
        "INTEGRATION_ENCRYPTION_KEY",
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
    assert payload["providers"]["whoop"]["connected"] is False
    assert "CLIENT_SECRET" not in str(payload)


def test_health_vitals_summary_uses_sanitized_fallback(client):
    response = client.get("/api/health-vitals/summary")

    assert response.status_code == 200
    assert response.headers["cache-control"] == (
        "public, max-age=0, s-maxage=30, stale-while-revalidate=120"
    )
    assert response.headers["vercel-cdn-cache-control"] == (
        "public, s-maxage=30, stale-while-revalidate=120"
    )
    payload = response.json()
    assert payload["success"] is True
    assert payload["status"] == "not_configured"
    assert payload["data"]["sleepScore"] is None
    assert payload["data"]["sourceStatus"] == "not_configured"
    assert payload["refresh"]["stale"] is False


def test_health_vitals_summary_serves_stale_cache_without_provider_refresh(client, monkeypatch):
    from api.routes import integrations as integrations_route

    calls = {"sync": 0, "state_updates": []}
    old_sync = (datetime.now(timezone.utc) - timedelta(hours=4)).isoformat().replace("+00:00", "Z")
    fresh_sync = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

    async def fake_fetch_latest_health_summary():
        if calls["sync"]:
            return {
                "status": "live",
                "source": "supabase",
                "data": {
                    "date": "2026-06-14",
                    "sleepScore": 88,
                    "recoveryScore": 70,
                    "strain": 6.1,
                    "restingHeartRate": 54,
                    "hrvTrend": "steady",
                    "weightTrend": "103.8 kg",
                    "lastSyncedAt": fresh_sync,
                    "sourceStatus": "synced",
                },
            }
        return {
            "status": "live",
            "source": "supabase",
            "data": {
                "date": "2026-06-14",
                "sleepScore": 81,
                "recoveryScore": 64,
                "strain": 4.8,
                "restingHeartRate": 57,
                "hrvTrend": "steady",
                "weightTrend": "104.0 kg",
                "lastSyncedAt": old_sync,
                "sourceStatus": "synced",
            },
        }

    async def fake_fetch_sync_state(provider):
        return {}

    async def fake_integration_is_connected(provider):
        return provider == "whoop"

    async def fake_sync_connected_health_providers():
        calls["sync"] += 1
        return {"saved": True, "results": [{"provider": "whoop", "status": "live"}]}

    async def fake_update_sync_state(provider, **fields):
        calls["state_updates"].append({"provider": provider, **fields})

    monkeypatch.setattr(
        integrations_route,
        "fetch_latest_health_summary",
        fake_fetch_latest_health_summary,
    )
    monkeypatch.setattr(integrations_route, "fetch_sync_state", fake_fetch_sync_state)
    monkeypatch.setattr(
        integrations_route,
        "integration_is_connected",
        fake_integration_is_connected,
    )
    monkeypatch.setattr(
        integrations_route,
        "sync_connected_health_providers",
        fake_sync_connected_health_providers,
    )
    monkeypatch.setattr(integrations_route, "update_sync_state", fake_update_sync_state)
    monkeypatch.setattr(integrations_route, "HEALTH_SUMMARY_AUTO_REFRESH_ON_READ", True)

    response = client.get("/api/health-vitals/summary")

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "stale"
    assert payload["data"]["sleepScore"] == 81
    assert payload["data"]["sourceStatus"] == "stale"
    assert payload["refresh"]["attempted"] is False
    assert payload["refresh"]["refreshed"] is False
    assert payload["refresh"]["stale"] is True
    assert payload["refresh"]["reason"] == "scheduled_or_admin_sync"
    assert calls["sync"] == 0
    assert calls["state_updates"] == []


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


def test_oauth_state_roundtrip(monkeypatch):
    monkeypatch.setenv("INTEGRATION_SYNC_ADMIN_TOKEN", "test-admin-token")
    state = create_oauth_state("google_calendar")
    assert verify_oauth_state(state, "google_calendar") is True
    assert verify_oauth_state(state, "whoop") is False


def test_google_calendar_connect_requires_configuration(client):
    response = client.get("/api/integrations/google-calendar/connect", follow_redirects=False)
    assert response.status_code == 503


def test_whoop_connect_requires_configuration(client):
    response = client.get("/api/integrations/whoop/connect", follow_redirects=False)
    assert response.status_code == 503


def test_withings_connect_requires_configuration(client):
    response = client.get("/api/integrations/withings/connect", follow_redirects=False)
    assert response.status_code == 503


def test_sync_all_requires_admin_token(client, monkeypatch):
    monkeypatch.setenv("INTEGRATION_SYNC_ADMIN_TOKEN", "test-admin-token")
    response = client.post("/api/integrations/sync-all")
    assert response.status_code == 403


def test_disconnect_unknown_provider(client, monkeypatch):
    monkeypatch.setenv("INTEGRATION_SYNC_ADMIN_TOKEN", "test-admin-token")
    response = client.post(
        "/api/integrations/unknown/disconnect",
        headers={"x-integration-admin-token": "test-admin-token"},
    )
    assert response.status_code == 404


def test_sync_all_with_admin_token_when_unconnected(client, monkeypatch):
    monkeypatch.setenv("INTEGRATION_SYNC_ADMIN_TOKEN", "test-admin-token")
    response = client.post(
        "/api/integrations/sync-all",
        headers={"x-integration-admin-token": "test-admin-token"},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert payload["results"] == []


def test_whoop_callback_rejects_invalid_state(client):
    response = client.get("/api/integrations/whoop/callback?code=fake&state=bad")
    assert response.status_code == 400


def test_calendar_webhook_acknowledges_sync_ping(client):
    response = client.post(
        "/api/calendar/webhook/google",
        headers={
            "X-Goog-Channel-ID": "test-channel",
            "X-Goog-Resource-State": "sync",
        },
    )
    assert response.status_code == 200
    assert response.json()["status"] == "acknowledged"


def test_platform_health_matrix_is_safe(client):
    response = client.get("/api/monitor/platform-health")

    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert isinstance(payload.get("checks"), list)
    assert payload["summary"]["total"] >= 1
    assert "integration_env" in payload
    assert "CLIENT_SECRET" not in str(payload)

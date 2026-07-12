"""Security hardening regression tests."""

import hashlib
import hmac
import os

import pytest
from fastapi.testclient import TestClient

os.environ.setdefault("VERCEL_ENV", "production")

from api.config import create_session_token, rate_limit_store
from api.index import app
from api.integrations.oauth_state import create_connect_auth_token, verify_connect_auth_token


@pytest.fixture
def client(monkeypatch):
    for name in (
        "SUPABASE_URL",
        "SUPABASE_SERVICE_ROLE_KEY",
        "WHOOP_CLIENT_ID",
        "WHOOP_CLIENT_SECRET",
        "WITHINGS_CLIENT_ID",
        "WITHINGS_CLIENT_SECRET",
        "GOOGLE_CALENDAR_CLIENT_ID",
        "GOOGLE_CALENDAR_CLIENT_SECRET",
        "GOOGLE_CALENDAR_REDIRECT_URI",
        "INTEGRATION_SYNC_ADMIN_TOKEN",
        "INTEGRATION_ENCRYPTION_KEY",
        "MONITOR_ADMIN_TOKEN",
    ):
        monkeypatch.delenv(name, raising=False)
    rate_limit_store.clear()
    return TestClient(app)


def test_connect_requires_signed_auth_when_configured(client, monkeypatch):
    monkeypatch.setenv("INTEGRATION_SYNC_ADMIN_TOKEN", "test-admin-token")
    monkeypatch.setenv("GOOGLE_CALENDAR_CLIENT_ID", "client-id")
    monkeypatch.setenv("GOOGLE_CALENDAR_CLIENT_SECRET", "client-secret")
    monkeypatch.setenv("GOOGLE_CALENDAR_REDIRECT_URI", "https://example.com/callback")

    response = client.get("/api/integrations/google-calendar/connect", follow_redirects=False)

    assert response.status_code == 403


def test_admin_connect_url_requires_token(client, monkeypatch):
    monkeypatch.setenv("INTEGRATION_SYNC_ADMIN_TOKEN", "test-admin-token")
    monkeypatch.setenv("GOOGLE_CALENDAR_CLIENT_ID", "client-id")
    monkeypatch.setenv("GOOGLE_CALENDAR_CLIENT_SECRET", "client-secret")
    monkeypatch.setenv("GOOGLE_CALENDAR_REDIRECT_URI", "https://example.com/callback")

    denied = client.get("/api/integrations/admin/connect-url/google-calendar")
    assert denied.status_code == 403

    allowed = client.get(
        "/api/integrations/admin/connect-url/google-calendar",
        headers={"x-integration-admin-token": "test-admin-token"},
    )
    assert allowed.status_code == 200
    payload = allowed.json()
    assert "auth=" in payload["url"]


def test_connect_auth_token_is_provider_bound(monkeypatch):
    monkeypatch.setenv("INTEGRATION_SYNC_ADMIN_TOKEN", "test-admin-token")
    token = create_connect_auth_token("whoop")
    assert verify_connect_auth_token(token, "whoop") is True
    assert verify_connect_auth_token(token, "withings") is False


def test_conversation_requires_session_token(client):
    session_id = "a" * 32
    response = client.get(f"/api/conversation/{session_id}")
    assert response.status_code == 403


def test_conversation_reads_with_valid_session_token(client):
    session_id = "b" * 32
    token = create_session_token(session_id)
    response = client.get(
        f"/api/conversation/{session_id}",
        headers={"x-session-token": token},
    )
    assert response.status_code == 200


def test_production_session_token_rejects_public_fallback_secret(monkeypatch):
    monkeypatch.setenv("VERCEL_ENV", "production")
    for name in (
        "SESSION_AUTH_SECRET",
        "INTEGRATION_ENCRYPTION_KEY",
        "INTEGRATION_SYNC_ADMIN_TOKEN",
    ):
        monkeypatch.delenv(name, raising=False)

    session_id = "c" * 32
    public_fallback_token = hmac.new(
        hashlib.sha256(b"production-session-auth-unconfigured").digest(),
        session_id.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

    assert create_session_token(session_id) != public_fallback_token


def test_calendar_webhook_rejects_unknown_channel(client, monkeypatch):
    monkeypatch.setenv("INTEGRATION_SYNC_ADMIN_TOKEN", "test-admin-token")

    async def _connected(_provider):
        return True

    async def _sync_state(_provider):
        return {"channel_id": "expected-channel", "channel_token": "expected-token"}

    monkeypatch.setattr("api.routes.integrations.integration_is_connected", _connected)
    monkeypatch.setattr("api.routes.integrations.fetch_sync_state", _sync_state)

    response = client.post(
        "/api/calendar/webhook/google",
        headers={
            "X-Goog-Channel-ID": "wrong-channel",
            "X-Goog-Channel-Token": "expected-token",
            "X-Goog-Resource-State": "exists",
        },
    )
    assert response.status_code == 403


def test_calendar_webhook_rejects_empty_watch_credentials(client, monkeypatch):
    """Fail closed when calendar is connected but no channel/token is stored."""

    async def _connected(_provider):
        return True

    async def _sync_state(_provider):
        return {}

    async def _sync_should_not_run():
        raise AssertionError("sync must not run without credentials")

    monkeypatch.setattr("api.routes.integrations.integration_is_connected", _connected)
    monkeypatch.setattr("api.routes.integrations.fetch_sync_state", _sync_state)
    monkeypatch.setattr(
        "api.routes.integrations.sync_google_calendar_availability", _sync_should_not_run
    )

    response = client.post(
        "/api/calendar/webhook/google",
        headers={
            "X-Goog-Channel-ID": "any-channel",
            "X-Goog-Channel-Token": "any-token",
            "X-Goog-Resource-State": "exists",
        },
    )
    assert response.status_code == 403

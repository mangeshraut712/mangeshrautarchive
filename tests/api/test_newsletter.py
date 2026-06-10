"""Tests for newsletter subscription API."""

import os

import pytest
from fastapi.testclient import TestClient

os.environ.setdefault("VERCEL_ENV", "production")

from api.config import rate_limit_store
from api.index import app


@pytest.fixture
def client():
    rate_limit_store.clear()
    return TestClient(app)


def test_newsletter_rejects_invalid_email(client):
    response = client.post("/api/newsletter/subscribe", json={"email": "not-an-email"})

    assert response.status_code == 400


def test_newsletter_rate_limited_returns_429(client, monkeypatch):
    monkeypatch.setattr("api.routes.general.check_rate_limit", lambda _client_ip: False)

    response = client.post(
        "/api/newsletter/subscribe", json={"email": "reader@example.com"}
    )

    assert response.status_code == 429


def test_newsletter_unconfigured_returns_503(client, monkeypatch):
    monkeypatch.delenv("GEMINI_FIREBASE_API_KEY", raising=False)
    monkeypatch.delenv("FIREBASE_API_KEY", raising=False)

    response = client.post(
        "/api/newsletter/subscribe", json={"email": "reader@example.com"}
    )

    assert response.status_code == 503

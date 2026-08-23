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


def test_newsletter_success_confirms_persistence(client, monkeypatch):
    class Response:
        status_code = 200
        is_success = True
        text = ""

        @staticmethod
        def json():
            return {"name": "projects/test/documents/newsletter_subscribers/subscriber-id"}

    class AsyncClient:
        def __init__(self, **_kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *_args):
            return None

        async def post(self, *_args, **_kwargs):
            return Response()

    monkeypatch.setenv("FIREBASE_API_KEY", "test-key")
    monkeypatch.setattr("api.routes.general.httpx.AsyncClient", AsyncClient)

    response = client.post(
        "/api/newsletter/subscribe", json={"email": "reader@example.com"}
    )

    assert response.status_code == 200
    assert response.json()["persisted"] is True
    assert response.json()["id"] == "subscriber-id"

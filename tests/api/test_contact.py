"""Tests for persisted contact messages."""

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


def test_contact_rejects_invalid_email(client):
    response = client.post(
        "/api/contact",
        json={
            "name": "Ada",
            "email": "invalid",
            "subject": "Architecture",
            "message": "Please review this system.",
        },
    )

    assert response.status_code == 400


def test_contact_success_confirms_persistence(client, monkeypatch):
    class Response:
        status_code = 200
        is_success = True
        text = ""

        @staticmethod
        def json():
            return {"name": "projects/test/documents/messages/contact-id"}

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
        "/api/contact",
        json={
            "name": "Ada",
            "email": "ada@example.com",
            "subject": "Architecture",
            "message": "Please review this system.",
        },
    )

    assert response.status_code == 200
    assert response.json()["persisted"] is True
    assert response.json()["id"] == "contact-id"

"""
Pytest unit tests for Firecrawl URL ingestion endpoint.
"""

from fastapi.testclient import TestClient
from api.index import app
from api.integrations.firecrawl_ingest import firecrawl_service

client = TestClient(app)


def test_ingest_url_validation_error():
    response = client.post(
        "/api/ingest-url",
        json={"url": "not-a-valid-url"},
    )
    assert response.status_code == 422


def test_ingest_url_empty_validation():
    response = client.post(
        "/api/ingest-url",
        json={"url": ""},
    )
    assert response.status_code == 400


def test_ingest_url_does_not_fetch_arbitrary_urls_without_firecrawl(monkeypatch):
    monkeypatch.setattr(firecrawl_service, "is_configured", False)
    response = client.post(
        "/api/ingest-url",
        json={"url": "https://example.com/article"},
    )
    assert response.status_code == 422
    assert "Firecrawl" in response.text


def test_ingest_url_rejects_private_and_metadata_hosts():
    for url in (
        "http://169.254.169.254/latest/meta-data/",
        "http://127.0.0.1/admin",
        "http://10.1.2.3/secret",
        "http://[::1]/",
        "https://user:pass@example.com/private",
        "file:///etc/passwd",
        "http://metadata.google.internal/computeMetadata/v1/",
    ):
        response = client.post("/api/ingest-url", json={"url": url})
        assert response.status_code == 422, url
        assert "Firecrawl" not in response.text


def test_ingest_url_does_not_call_firecrawl_for_private_hosts(monkeypatch):
    monkeypatch.setattr(firecrawl_service, "is_configured", True)
    calls = []

    class FakeClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            return False

        async def post(self, *args, **kwargs):
            calls.append(args)
            raise AssertionError("private hosts must not be fetched")

    monkeypatch.setattr("httpx.AsyncClient", FakeClient)
    response = client.post(
        "/api/ingest-url",
        json={"url": "http://169.254.169.254/latest/meta-data/"},
    )
    assert response.status_code == 422
    assert calls == []

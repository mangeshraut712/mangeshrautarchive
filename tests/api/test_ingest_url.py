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
        json={"url": "http://169.254.169.254/latest/meta-data/"},
    )
    assert response.status_code == 422
    assert "Firecrawl" in response.text

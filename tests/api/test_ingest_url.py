"""
Pytest unit tests for Firecrawl URL ingestion endpoint.
"""

from fastapi.testclient import TestClient
from api.index import app

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

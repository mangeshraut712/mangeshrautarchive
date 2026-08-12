"""
Pytest unit tests for Upstash Context7 Vector RAG endpoint.
"""

from fastapi.testclient import TestClient
from api.index import app

client = TestClient(app)


def test_vector_search_endpoint_success():
    response = client.post(
        "/api/vector-search",
        json={"query": "Java Spring Framework microservices", "top_k": 2},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["query"] == "Java Spring Framework microservices"
    assert "results" in data
    assert data["source"] in ["upstash_remote", "local_semantic_fallback"]
    assert len(data["results"]) <= 2


def test_vector_search_empty_query_validation():
    response = client.post(
        "/api/vector-search",
        json={"query": "   ", "top_k": 3},
    )
    assert response.status_code == 400

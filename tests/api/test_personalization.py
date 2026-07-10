from fastapi.testclient import TestClient

from api.index import app

client = TestClient(app)


def test_personalization_export_returns_payload():
    response = client.get("/api/personalization/export")
    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert "data" in payload
    assert "user_id" in payload["data"]


def test_personalization_delete_clears_user_data():
    client.post(
        "/api/personalization/preferences",
        json={"preferences": {"memory_enabled": True}},
    )
    response = client.delete("/api/personalization/delete")
    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert payload["removed"]["removed_users"] == 1

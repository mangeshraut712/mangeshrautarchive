import pytest
from fastapi.testclient import TestClient
from api.index import app

client = TestClient(app)


def test_get_resume_info():
    """Verify GET /api/resume returns metadata for all available editions."""
    response = client.get("/api/resume")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "editions" in data
    assert "usa" in data["editions"]
    assert "india" in data["editions"]
    assert "primary" in data["editions"]

    usa = data["editions"]["usa"]
    assert usa["download_name"] == "Mangesh_Raut_Resume_USA.pdf"
    assert usa["available"] is True


def test_download_resume_usa():
    """Verify GET /api/resume/download?region=usa returns PDF file with attachment headers."""
    response = client.get("/api/resume/download?region=usa")
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert 'filename="Mangesh_Raut_Resume_USA.pdf"' in response.headers["content-disposition"]
    assert len(response.content) > 1000  # Non-empty PDF payload


def test_download_resume_india():
    """Verify GET /api/resume/download?region=india returns PDF file with attachment headers."""
    response = client.get("/api/resume/download?region=india")
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert 'filename="Mangesh_Raut_Resume_Pune.pdf"' in response.headers["content-disposition"]
    assert len(response.content) > 1000


def test_download_resume_default_fallback():
    """Verify GET /api/resume/download with invalid region defaults safely to usa edition."""
    response = client.get("/api/resume/download?region=invalid_region")
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert 'filename="Mangesh_Raut_Resume_USA.pdf"' in response.headers["content-disposition"]

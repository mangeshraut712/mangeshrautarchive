"""Tests for GitHub proxy and repos API endpoints."""

import os
from unittest.mock import AsyncMock, patch

import httpx
import pytest
from fastapi.testclient import TestClient

os.environ.setdefault("VERCEL_ENV", "production")

from api.config import _github_proxy_cache, _github_api_proxy_cache
from api.index import app


@pytest.fixture(autouse=True)
def clear_caches():
    _github_proxy_cache.clear()
    _github_api_proxy_cache.clear()


@pytest.fixture
def client():
    return TestClient(app)


class TestGithubRepos:
    def test_repos_rejects_invalid_username(self, client):
        response = client.get("/api/github/repos?username=")
        assert response.status_code == 400

    def test_repos_rejects_special_chars(self, client):
        response = client.get("/api/github/repos?username=<script>")
        assert response.status_code == 400

    def test_repos_rejects_long_username(self, client):
        response = client.get("/api/github/repos?username=" + "a" * 50)
        assert response.status_code == 400

    @pytest.mark.anyio
    @patch("api.routes.github.github_connector.get_repositories", new_callable=AsyncMock)
    async def test_repos_returns_empty_list(self, mock_get_repos):
        mock_get_repos.return_value = []
        # Use async client for the route
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as ac:
            resp = await ac.get("/api/github/repos?username=testuser")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)

    @pytest.mark.anyio
    @patch("api.routes.github.github_connector.get_repositories", new_callable=AsyncMock)
    async def test_repos_returns_repo_list(self, mock_get_repos):
        mock_get_repos.return_value = [
            {
                "id": 1,
                "name": "test-repo",
                "full_name": "testuser/test-repo",
                "html_url": "https://github.com/testuser/test-repo",
                "description": "A test repo",
                "stargazers_count": 5,
                "forks_count": 2,
                "language": "Python",
                "updated_at": "2026-01-01T00:00:00Z",
            }
        ]
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as ac:
            resp = await ac.get("/api/github/repos?username=testuser")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert data[0]["name"] == "test-repo"


class TestGithubProxy:
    def test_proxy_rejects_missing_path(self, client):
        response = client.get("/api/github/proxy")
        assert response.status_code == 400

    def test_proxy_rejects_empty_path(self, client):
        response = client.get("/api/github/proxy?path=")
        assert response.status_code == 400

    def test_proxy_rejects_disallowed_prefix(self, client):
        response = client.get("/api/github/proxy?path=/orgs/test")
        assert response.status_code == 400

    def test_proxy_rejects_long_path(self, client):
        response = client.get("/api/github/proxy?path=" + "/repos/test/" + "a" * 1000)
        assert response.status_code == 400

    def test_proxy_allows_repos_path(self, client):
        response = client.get("/api/github/proxy?path=/repos/testuser/test-repo")
        # Should either succeed, be not found, or return 503 (GitHub API unreachable in test)
        assert response.status_code in (200, 404, 503)

    def test_proxy_allows_users_path(self, client):
        response = client.get("/api/github/proxy?path=/users/testuser")
        assert response.status_code in (200, 404, 503)

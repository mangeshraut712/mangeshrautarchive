"""Regression: GitHub proxy must reject path-traversal before upstream/PAT use."""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from api.index import app


@pytest.fixture
def client():
    return TestClient(app)


class TestGithubProxyTraversal:
    def test_proxy_rejects_dotdot_escape_to_other_user(self, client):
        """Allowlist must run on a normalized path so .. cannot escape the portfolio user."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"login": "octocat"}
        mock_response.headers = {}

        mock_client = AsyncMock()
        mock_client.get = AsyncMock(return_value=mock_response)
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)

        with patch("api.routes.github.httpx.AsyncClient", return_value=mock_client):
            response = client.get(
                "/api/github/proxy?path=/users/mangeshraut712/../../users/octocat"
            )

        assert response.status_code == 400, (
            "path traversal must be rejected by allowlist, "
            f"got {response.status_code}: {response.text[:200]}"
        )
        mock_client.get.assert_not_called()

    def test_proxy_rejects_dotdot_escape_to_other_repo(self, client):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"full_name": "octocat/Hello-World"}
        mock_response.headers = {}

        mock_client = AsyncMock()
        mock_client.get = AsyncMock(return_value=mock_response)
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)

        with patch("api.routes.github.httpx.AsyncClient", return_value=mock_client):
            response = client.get(
                "/api/github/proxy?path=/repos/mangeshraut712/../../octocat/Hello-World"
            )

        assert response.status_code == 400
        mock_client.get.assert_not_called()

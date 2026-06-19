"""Tests for media proxy behavior."""

import os

from fastapi.testclient import TestClient

os.environ.setdefault("VERCEL_ENV", "production")

from api.config import lastfm_recent_cache
from api.index import app


def test_music_recent_returns_latency_headers_when_lastfm_unconfigured(monkeypatch):
    monkeypatch.setattr("api.routes.media.LASTFM_API_KEY", "")
    lastfm_recent_cache.clear()
    client = TestClient(app)

    response = client.get("/api/music/recent?user=mbr63&limit=1")

    assert response.status_code == 200
    assert response.headers["X-Music-Source"] == "lastfm-proxy"
    assert response.headers["X-Lastfm-Cache"] == "UNCONFIGURED"
    assert int(response.headers["X-Lastfm-Latency-Ms"]) >= 0
    assert response.json()["source"] == "lastfm-unconfigured"

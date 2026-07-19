"""Tests for media proxy behavior."""

import os
import time

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


def test_music_recent_serves_stale_cache_before_refresh(monkeypatch):
    monkeypatch.setattr("api.routes.media.LASTFM_API_KEY", "configured")
    lastfm_recent_cache.clear()
    lastfm_recent_cache["mbr63:1"] = {
        "data": {
            "recenttracks": {
                "track": [
                    {
                        "name": "Cached Track",
                        "artist": {"#text": "Cached Artist"},
                        "resolved_artwork": "https://lastfm.freetls.fastly.net/i/u/300x300/abc.jpg",
                        "artwork_source": "lastfm",
                    }
                ]
            }
        },
        "ts": time.time() - 90,
    }

    async def noop_refresh(*_args, **_kwargs):
        return None

    monkeypatch.setattr("api.routes.media.refresh_lastfm_recent_cache", noop_refresh)
    client = TestClient(app)

    response = client.get("/api/music/recent?user=mbr63&limit=1")

    assert response.status_code == 200
    assert response.headers["X-Lastfm-Cache"] == "STALE"
    assert response.headers["X-Lastfm-Stale"] == "1"
    assert response.headers["Access-Control-Allow-Origin"] == "*"
    assert int(response.headers["X-Lastfm-Latency-Ms"]) >= 0
    assert response.json()["recenttracks"]["track"][0]["name"] == "Cached Track"


def test_music_recent_enriches_placeholder_artwork(monkeypatch):
    monkeypatch.setattr("api.routes.media.LASTFM_API_KEY", "configured")
    lastfm_recent_cache.clear()
    lastfm_recent_cache["mbr63:1"] = {
        "data": {
            "recenttracks": {
                "track": [
                    {
                        "name": "Piya Aaye Na",
                        "artist": {"#text": "Tulsi Kumar"},
                        "image": [
                            {
                                "size": "extralarge",
                                "#text": (
                                    "https://lastfm.freetls.fastly.net/i/u/300x300/"
                                    "2a96cbd8b46e442fc41c2b86b821562f.png"
                                ),
                            }
                        ],
                    }
                ]
            }
        },
        "ts": time.time(),
    }

    async def fake_itunes(search_term: str, artist_hint: str = "") -> str:
        assert "Piya Aaye Na" in search_term
        assert artist_hint == "Tulsi Kumar"
        return "https://is1-ssl.mzstatic.com/image/thumb/Music/example/600x600bb.jpg"

    async def noop_refresh(*_args, **_kwargs):
        return None

    monkeypatch.setattr("api.routes.media.fetch_itunes_artwork", fake_itunes)
    monkeypatch.setattr("api.routes.media.refresh_lastfm_recent_cache", noop_refresh)
    client = TestClient(app)

    response = client.get("/api/music/recent?user=mbr63&limit=1")

    assert response.status_code == 200
    track = response.json()["recenttracks"]["track"][0]
    assert track["resolved_artwork"].endswith("/600x600bb.jpg")
    assert track["artwork_source"] == "itunes"


def test_music_artwork_returns_itunes_url(monkeypatch):
    from api.config import artwork_cache

    artwork_cache.clear()

    class MockResponse:
        status_code = 200

        def raise_for_status(self):
            return None

        def json(self):
            return {
                "results": [
                    {
                        "artworkUrl100": "https://is1-ssl.mzstatic.com/example/100x100bb.jpg",
                    }
                ]
            }

    class MockClient:
        async def __aenter__(self):
            return self

        async def __aexit__(self, *_args):
            return None

        async def get(self, *_args, **_kwargs):
            return MockResponse()

    monkeypatch.setattr("api.routes.media.httpx.AsyncClient", lambda **_kwargs: MockClient())
    client = TestClient(app)

    response = client.get("/api/music/artwork?track=Test%20Song&artist=Test%20Artist")

    assert response.status_code == 200
    payload = response.json()
    assert payload["source"] == "itunes"
    assert payload["artwork_url"].endswith("/600x600bb.jpg")
    assert payload["term"] == "Test Song Test Artist"


def test_music_artwork_requires_search_term():
    client = TestClient(app)

    response = client.get("/api/music/artwork")

    assert response.status_code == 400

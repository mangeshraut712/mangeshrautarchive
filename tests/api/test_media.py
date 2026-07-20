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

    async def fake_resolve(track: str, artist: str = ""):
        assert "Piya Aaye Na" in track
        assert artist == "Tulsi Kumar"
        return (
            "https://is1-ssl.mzstatic.com/image/thumb/Music/example/600x600bb.jpg",
            "itunes",
        )

    async def noop_refresh(*_args, **_kwargs):
        return None

    monkeypatch.setattr("api.routes.media.resolve_external_artwork", fake_resolve)
    monkeypatch.setattr("api.routes.media.refresh_lastfm_recent_cache", noop_refresh)
    client = TestClient(app)

    response = client.get("/api/music/recent?user=mbr63&limit=1")

    assert response.status_code == 200
    track = response.json()["recenttracks"]["track"][0]
    assert track["resolved_artwork"].endswith("/600x600bb.jpg")
    assert track["artwork_source"] == "itunes"


def test_music_artwork_falls_back_to_lastfm_track(monkeypatch):
    from api.config import artwork_cache

    artwork_cache.clear()

    async def no_itunes(*_args, **_kwargs):
        return ""

    async def lastfm_art(track: str, artist: str = "") -> str:
        assert track == "Piya Aaye Na"
        assert artist == "Tulsi Kumar"
        return "https://lastfm.freetls.fastly.net/i/u/300x300/album.png"

    monkeypatch.setattr("api.routes.media.fetch_itunes_artwork", no_itunes)
    monkeypatch.setattr("api.routes.media.fetch_lastfm_track_artwork", lastfm_art)
    client = TestClient(app)

    response = client.get("/api/music/artwork?track=Piya%20Aaye%20Na&artist=Tulsi%20Kumar")

    assert response.status_code == 200
    payload = response.json()
    assert payload["source"] == "lastfm-track"
    assert payload["artwork_url"].endswith("/album.png")


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


def test_pick_itunes_artwork_matches_correct_track_not_just_artist():
    """Among songs by the same artist, pick the one whose track name matches."""
    from api.routes.media import _pick_itunes_artwork

    results = [
        {
            "artistName": "Coldplay",
            "trackName": "The Scientist",
            "collectionName": "A Rush of Blood to the Head",
            "artworkUrl100": "https://itunes/scientist/100x100bb.jpg",
        },
        {
            "artistName": "Coldplay",
            "trackName": "Yellow",
            "collectionName": "Parachutes",
            "artworkUrl100": "https://itunes/yellow/100x100bb.jpg",
        },
    ]

    artwork = _pick_itunes_artwork(results, track_hint="Yellow", artist_hint="Coldplay")

    assert artwork == "https://itunes/yellow/600x600bb.jpg"


def test_pick_itunes_artwork_rejects_unrelated_results():
    """If neither artist nor track match, return nothing rather than wrong art."""
    from api.routes.media import _pick_itunes_artwork

    results = [
        {
            "artistName": "Someone Else",
            "trackName": "A Different Song",
            "collectionName": "Other Album",
            "artworkUrl100": "https://itunes/wrong/100x100bb.jpg",
        }
    ]

    artwork = _pick_itunes_artwork(results, track_hint="Yellow", artist_hint="Coldplay")

    assert artwork == ""


def test_pick_itunes_artwork_ignores_feat_and_remaster_noise():
    """Normalization should still match despite (feat. …) / - Remastered suffixes."""
    from api.routes.media import _pick_itunes_artwork

    results = [
        {
            "artistName": "Eminem",
            "trackName": "Stan (feat. Dido)",
            "collectionName": "The Marshall Mathers LP",
            "artworkUrl100": "https://itunes/stan/100x100bb.jpg",
        }
    ]

    artwork = _pick_itunes_artwork(
        results, track_hint="Stan - Remastered", artist_hint="Eminem"
    )

    assert artwork == "https://itunes/stan/600x600bb.jpg"

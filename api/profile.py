import base64
import os
from datetime import datetime, timezone
from typing import Any

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse

from api.integrations.github_connector import github_connector

load_dotenv()

app = FastAPI(title="Profile Signals API", version="1.0.0")
if os.getenv("VERCEL_ENV", "local") != "local":
    app.add_middleware(GZipMiddleware, minimum_size=500)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://mangeshraut.pro",
        "https://mangeshrautarchive.vercel.app",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    allow_credentials=False,
    allow_methods=["GET", "OPTIONS"],
    allow_headers=["Content-Type", "Accept", "Origin"],
)

KV_REST_API_URL = os.getenv("KV_REST_API_URL", "").strip() or os.getenv("UPSTASH_REDIS_REST_URL", "").strip()
KV_REST_API_TOKEN = os.getenv("KV_REST_API_TOKEN", "").strip() or os.getenv("UPSTASH_REDIS_REST_TOKEN", "").strip()
PROFILE_VIEWS_KEY = (
    os.getenv("PROFILE_VIEWS_KEY", "").strip()
    or os.getenv("COUNTIFY_PROFILE_VIEWS_KEY", "").strip()
    or "portfolio:views"
)
COUNTIFY_BASE_URL = os.getenv("COUNTIFY_BASE_URL", "https://api.countify.xyz")
SPOTIFY_CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID", "").strip()
SPOTIFY_CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET", "").strip()
SPOTIFY_REFRESH_TOKEN = os.getenv("SPOTIFY_REFRESH_TOKEN", "").strip()
LASTFM_API_KEY = os.getenv("LASTFM_API_KEY", "").strip()
LASTFM_USERNAME = os.getenv("LASTFM_USERNAME", "").strip()
LASTFM_API_URL = "https://ws.audioscrobbler.com/2.0/"
SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token"
SPOTIFY_CURRENTLY_PLAYING_URL = "https://api.spotify.com/v1/me/player/currently-playing"
SPOTIFY_RECENTLY_PLAYED_URL = "https://api.spotify.com/v1/me/player/recently-played?limit=1"
GITHUB_USERNAME = os.getenv("GITHUB_USERNAME", "mangeshraut712").strip()
GITHUB_USER_URL = f"https://api.github.com/users/{GITHUB_USERNAME}"
GITHUB_EVENTS_URL = f"https://api.github.com/users/{GITHUB_USERNAME}/events/public"


async def fetch_json(method: str, url: str, **kwargs):
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.request(method, url, **kwargs)
        response.raise_for_status()
        return response.json()


def iso_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def coerce_count(payload: Any) -> int:
    if isinstance(payload, dict):
        for key in ("result", "total", "count", "value", "views"):
            value = payload.get(key)
            if value is not None:
                try:
                    return int(value)
                except (TypeError, ValueError):
                    continue

    try:
        return int(payload)
    except (TypeError, ValueError):
        return 0


async def fetch_redis_views(mode: str) -> dict:
    headers = {"Authorization": f"Bearer {KV_REST_API_TOKEN}"}
    route = "incr" if mode == "increment" else "get"
    payload = await fetch_json("POST" if route == "incr" else "GET", f"{KV_REST_API_URL}/{route}/{PROFILE_VIEWS_KEY}", headers=headers)

    return {
        "success": True,
        "count": coerce_count(payload),
        "mode": mode,
        "provider": "redis",
        "updatedAt": iso_now(),
    }


async def fetch_countify_views(mode: str) -> dict:
    if mode == "increment":
        payload = await fetch_json("POST", f"{COUNTIFY_BASE_URL}/increment/{PROFILE_VIEWS_KEY}")
    else:
        payload = await fetch_json("GET", f"{COUNTIFY_BASE_URL}/get-total/{PROFILE_VIEWS_KEY}")

    return {
        "success": True,
        "count": coerce_count(payload),
        "mode": mode,
        "provider": "countify",
        "updatedAt": iso_now(),
    }


@app.get("/api/profile/views")
async def get_profile_views(mode: str = "increment", page: str = "home"):
    safe_mode = mode if mode in {"increment", "get"} else "get"

    try:
        normalized_page = str(page or "home").strip().lower()
    except Exception:
        normalized_page = "home"

    try:
        if safe_mode == "increment" and normalized_page != "home":
            safe_mode = "get"

        if KV_REST_API_URL and KV_REST_API_TOKEN:
            payload = await fetch_redis_views(safe_mode)
            payload["page"] = normalized_page
            return payload

        payload = await fetch_countify_views(safe_mode)
        payload["page"] = normalized_page
        return payload
    except Exception:
        return JSONResponse(
            status_code=200,
            content={
                "success": False,
                "count": 0,
                "mode": safe_mode,
                "page": normalized_page,
                "provider": "unavailable",
                "message": "View counter unavailable",
                "updatedAt": iso_now(),
            },
        )


async def get_spotify_access_token() -> str:
    basic = base64.b64encode(f"{SPOTIFY_CLIENT_ID}:{SPOTIFY_CLIENT_SECRET}".encode("utf-8")).decode("utf-8")
    headers = {
        "Authorization": f"Basic {basic}",
        "Content-Type": "application/x-www-form-urlencoded",
    }
    data = {
        "grant_type": "refresh_token",
        "refresh_token": SPOTIFY_REFRESH_TOKEN,
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.post(SPOTIFY_TOKEN_URL, headers=headers, data=data)
        response.raise_for_status()
        payload = response.json()

    access_token = payload.get("access_token")
    if not access_token:
        raise RuntimeError("Spotify token refresh did not return an access token")
    return access_token


async def fetch_spotify_payload(url: str, access_token: str):
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/json",
    }
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(url, headers=headers)
        if response.status_code == 204:
            return None
        response.raise_for_status()
        return response.json()


def normalize_spotify_item(item: dict, *, is_playing: bool, status_label: str) -> dict:
    album = item.get("album") or {}
    artists = item.get("artists") or []
    images = album.get("images") or []
    external_urls = item.get("external_urls") or {}

    return {
        "available": True,
        "isPlaying": is_playing,
        "statusLabel": status_label,
        "song": item.get("name") or "Unknown track",
        "artist": ", ".join(artist.get("name", "") for artist in artists if artist.get("name")) or "Unknown artist",
        "album": album.get("name") or "",
        "albumArt": images[0].get("url") if images else "",
        "trackUrl": external_urls.get("spotify") or "https://open.spotify.com/",
        "updatedAt": iso_now(),
    }


async def fetch_lastfm_recent_track() -> dict | None:
    if not (LASTFM_API_KEY and LASTFM_USERNAME):
        return None

    payload = await fetch_json(
        "GET",
        LASTFM_API_URL,
        params={
            "method": "user.getrecenttracks",
            "user": LASTFM_USERNAME,
            "api_key": LASTFM_API_KEY,
            "format": "json",
            "limit": 1,
        },
    )

    tracks = (payload or {}).get("recenttracks", {}).get("track") or []
    if not tracks:
        return {
            "available": False,
            "isPlaying": False,
            "statusLabel": "Last.fm connected",
            "song": "No scrobbles yet",
            "artist": f"Start playing music with scrobbling enabled for {LASTFM_USERNAME}",
            "album": "",
            "albumArt": "",
            "trackUrl": "https://www.last.fm/user/" + LASTFM_USERNAME,
            "updatedAt": iso_now(),
        }

    track = tracks[0]
    image_candidates = track.get("image") or []
    image_url = ""
    for image in reversed(image_candidates):
        candidate = image.get("#text", "").strip()
        if candidate:
            image_url = candidate
            break

    artist = track.get("artist")
    if isinstance(artist, dict):
        artist_name = artist.get("#text", "").strip()
    else:
        artist_name = str(artist or "").strip()

    now_playing = str((track.get("@attr") or {}).get("nowplaying", "")).lower() == "true"

    return {
        "available": True,
        "isPlaying": now_playing,
        "statusLabel": "Live on Last.fm" if now_playing else "Recently played",
        "song": track.get("name") or "Unknown track",
        "artist": artist_name or "Unknown artist",
        "album": (track.get("album") or {}).get("#text", ""),
        "albumArt": image_url,
        "trackUrl": track.get("url") or ("https://www.last.fm/user/" + LASTFM_USERNAME),
        "updatedAt": iso_now(),
    }


@app.get("/api/profile/spotify")
async def get_spotify_now_playing():
    spotify_configured = bool(SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET and SPOTIFY_REFRESH_TOKEN)
    spotify_data = None
    spotify_error = None

    if spotify_configured:
        try:
            access_token = await get_spotify_access_token()
            current_payload = await fetch_spotify_payload(SPOTIFY_CURRENTLY_PLAYING_URL, access_token)

            if current_payload and current_payload.get("item"):
                spotify_data = normalize_spotify_item(
                    current_payload["item"],
                    is_playing=bool(current_payload.get("is_playing")),
                    status_label="Now playing" if current_payload.get("is_playing") else "Paused on Spotify",
                )
                spotify_data["source"] = "spotify"
                
                # If actually playing on Spotify, prioritize it immediately
                if spotify_data["isPlaying"]:
                    return spotify_data
        except Exception as e:
            spotify_error = str(e)

    # Check Last.fm as secondary source or fallback for Spotify paused
    try:
        lastfm_payload = await fetch_lastfm_recent_track()
        if lastfm_payload:
            lastfm_payload["source"] = "lastfm"
            
            # If Last.fm is actively playing, use it over a paused Spotify
            if lastfm_payload.get("isPlaying"):
                return lastfm_payload
                
            # If Spotify was playing recently/paused, use that over Last.fm recent
            if spotify_data:
                return spotify_data
                
            # Otherwise use Last.fm recent
            return lastfm_payload
    except Exception:
        pass

    # Final fallback if both fail or are empty
    return JSONResponse(
        status_code=200,
        content={
            "available": False,
            "isPlaying": False,
            "source": "none",
            "statusLabel": "Music source unavailable",
            "song": "No live music source connected",
            "artist": "Set Spotify credentials or connect Last.fm scrobbling",
            "album": "",
            "albumArt": "",
            "trackUrl": "https://open.spotify.com/",
            "updatedAt": iso_now(),
            "debug": {"spotify_configured": spotify_configured, "spotify_error": spotify_error}
        },
    )

@app.get("/api/profile/github/activity")
async def get_github_activity():
    try:
        summary = await github_connector.get_user_activity_summary(GITHUB_USERNAME)
        recent_stats = summary.get("recent_activity_stats") or {}

        feed = [
            {
                "id": f"{event.get('repo_full_name', event.get('repo', 'repo'))}:{event.get('created_at', '')}",
                "type": event.get("type"),
                "repo": event.get("repo"),
                "created_at": event.get("created_at"),
                "time_ago": event.get("created_at"),
                "message": event.get("action") or "GitHub activity",
                "detail": event.get("branch") or event.get("repo") or "",
            }
            for event in (summary.get("recent_events") or [])[:5]
        ]

        return {
            "success": True,
            "username": GITHUB_USERNAME,
            "avatar": None,
            "profile_stats": {
                "repos": summary.get("total_public_repos", 0),
                "followers": summary.get("followers", 0),
                "following": summary.get("following", 0),
                "total_stars": summary.get("total_stars", 0),
                "total_forks": summary.get("total_forks", 0),
                "languages_count": summary.get("language_count", 0),
                "total_contributors": recent_stats.get("repos_touched", 0),
            },
            "today_stats": {
                "pushed_today": recent_stats.get("pushes", 0),
                "stars_given": 0,
                "repos_created": 0,
                "prs_opened": recent_stats.get("pull_requests", 0),
            },
            "feed": feed,
            "provider": "github_connector",
            "updatedAt": iso_now()
        }
    except Exception:
        return JSONResponse(
            status_code=200,
            content={
                "success": False,
                "error": "GitHub activity temporarily unavailable",
                "updatedAt": iso_now()
            },
        )

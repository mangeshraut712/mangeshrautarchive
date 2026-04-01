import base64
import os
from datetime import datetime, timezone

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse

load_dotenv()

app = FastAPI(title="Profile Signals API", version="1.0.0")
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

COUNTIFY_BASE_URL = os.getenv("COUNTIFY_BASE_URL", "https://api.countify.xyz")
COUNTIFY_PROFILE_VIEWS_KEY = os.getenv("COUNTIFY_PROFILE_VIEWS_KEY", "mangesh-raut-homepage-views")
SPOTIFY_CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID", "").strip()
SPOTIFY_CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET", "").strip()
SPOTIFY_REFRESH_TOKEN = os.getenv("SPOTIFY_REFRESH_TOKEN", "").strip()
SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token"
SPOTIFY_CURRENTLY_PLAYING_URL = "https://api.spotify.com/v1/me/player/currently-playing"
SPOTIFY_RECENTLY_PLAYED_URL = "https://api.spotify.com/v1/me/player/recently-played?limit=1"


async def fetch_json(method: str, url: str, **kwargs):
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.request(method, url, **kwargs)
        response.raise_for_status()
        return response.json()


def iso_now() -> str:
    return datetime.now(timezone.utc).isoformat()


@app.get("/api/profile/views")
async def get_profile_views(mode: str = "increment"):
    safe_mode = mode if mode in {"increment", "get"} else "get"

    try:
        if safe_mode == "increment":
            payload = await fetch_json("POST", f"{COUNTIFY_BASE_URL}/increment/{COUNTIFY_PROFILE_VIEWS_KEY}")
        else:
            payload = await fetch_json("GET", f"{COUNTIFY_BASE_URL}/get-total/{COUNTIFY_PROFILE_VIEWS_KEY}")

        count = payload.get("total") or payload.get("count") or payload.get("value") or 0
        return {
            "success": True,
            "count": int(count),
            "mode": safe_mode,
            "updatedAt": iso_now(),
        }
    except Exception as exc:
        return JSONResponse(
            status_code=200,
            content={
                "success": False,
                "count": 0,
                "mode": safe_mode,
                "message": f"View counter unavailable: {exc}",
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
        "title": item.get("name") or "Unknown track",
        "artist": ", ".join(artist.get("name", "") for artist in artists if artist.get("name")) or "Unknown artist",
        "album": album.get("name") or "",
        "albumArtUrl": images[0].get("url") if images else "",
        "trackUrl": external_urls.get("spotify") or "https://open.spotify.com/",
        "updatedAt": iso_now(),
    }


@app.get("/api/profile/spotify")
async def get_spotify_now_playing():
    if not (SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET and SPOTIFY_REFRESH_TOKEN):
        return {
            "available": False,
            "isPlaying": False,
            "statusLabel": "Spotify unavailable",
            "title": "Connect Spotify to show live listening",
            "artist": "Set SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, and SPOTIFY_REFRESH_TOKEN",
            "album": "",
            "albumArtUrl": "",
            "trackUrl": "https://open.spotify.com/",
            "updatedAt": iso_now(),
        }

    try:
        access_token = await get_spotify_access_token()
        current_payload = await fetch_spotify_payload(SPOTIFY_CURRENTLY_PLAYING_URL, access_token)

        if current_payload and current_payload.get("item"):
            return normalize_spotify_item(
                current_payload["item"],
                is_playing=bool(current_payload.get("is_playing")),
                status_label="Now playing" if current_payload.get("is_playing") else "Paused on Spotify",
            )

        recent_payload = await fetch_spotify_payload(SPOTIFY_RECENTLY_PLAYED_URL, access_token)
        items = (recent_payload or {}).get("items") or []
        recent_item = items[0]["track"] if items and items[0].get("track") else None

        if recent_item:
            return normalize_spotify_item(recent_item, is_playing=False, status_label="Recently played")

        return {
            "available": False,
            "isPlaying": False,
            "statusLabel": "Nothing recent on Spotify",
            "title": "No recent playback found",
            "artist": "Open Spotify and play something to light this up",
            "album": "",
            "albumArtUrl": "",
            "trackUrl": "https://open.spotify.com/",
            "updatedAt": iso_now(),
        }
    except Exception as exc:
        return JSONResponse(
            status_code=200,
            content={
                "available": False,
                "isPlaying": False,
                "statusLabel": "Spotify unavailable",
                "title": "Live listening is temporarily offline",
                "artist": str(exc),
                "album": "",
                "albumArtUrl": "",
                "trackUrl": "https://open.spotify.com/",
                "updatedAt": iso_now(),
            },
        )

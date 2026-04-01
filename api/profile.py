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
LASTFM_API_KEY = os.getenv("LASTFM_API_KEY", "").strip()
LASTFM_USERNAME = os.getenv("LASTFM_USERNAME", "").strip()
LASTFM_API_URL = "https://ws.audioscrobbler.com/2.0/"
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
    except Exception:
        return JSONResponse(
            status_code=200,
            content={
                "success": False,
                "count": 0,
                "mode": safe_mode,
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

    if spotify_configured:
        try:
            access_token = await get_spotify_access_token()
            current_payload = await fetch_spotify_payload(SPOTIFY_CURRENTLY_PLAYING_URL, access_token)

            # If Spotify is ACTIVELY playing, prioritize it
            if current_payload and current_payload.get("item") and current_payload.get("is_playing"):
                return normalize_spotify_item(
                    current_payload["item"],
                    is_playing=True,
                    status_label="Now playing",
                )
            
            # If Spotify is NOT playing (paused or idle), check Last.fm for live activity
            lastfm_payload = await fetch_lastfm_recent_track()
            if lastfm_payload and lastfm_payload.get("isPlaying"):
                return lastfm_payload

            # If Last.fm is NOT playing either, but we have a paused Spotify track, return that
            if current_payload and current_payload.get("item"):
                return normalize_spotify_item(
                    current_payload["item"],
                    is_playing=False,
                    status_label="Paused on Spotify",
                )

            # Otherwise check for Spotify recently played
            recent_payload = await fetch_spotify_payload(SPOTIFY_RECENTLY_PLAYED_URL, access_token)
            items = (recent_payload or {}).get("items") or []
            recent_item = items[0]["track"] if items and items[0].get("track") else None

            if recent_item:
                return normalize_spotify_item(recent_item, is_playing=False, status_label="Recently played")
        except Exception:
            pass

    # If all Spotify logic fails or is skiped, try Last.fm recent (even if not playing)
    try:
        lastfm_payload = await fetch_lastfm_recent_track()
        if lastfm_payload:
            return lastfm_payload
    except Exception:
        pass

    return JSONResponse(
        status_code=200,
        content={
            "available": False,
            "isPlaying": False,
            "statusLabel": "Music source unavailable",
            "title": "No live music source connected",
            "artist": "Set Spotify credentials or connect Last.fm scrobbling",
            "album": "",
            "albumArtUrl": "",
            "trackUrl": "https://open.spotify.com/",
            "updatedAt": iso_now(),
        },
    )

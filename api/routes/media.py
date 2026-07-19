import asyncio
import time
import json
import logging
from typing import List, Optional
from urllib.parse import quote
from fastapi import APIRouter, HTTPException, BackgroundTasks, Request
from fastapi.responses import JSONResponse

import httpx

logger = logging.getLogger(__name__)

from api.config import (
    TMDB_API_KEY,
    GOOGLE_BOOKS_API_KEY,
    LASTFM_API_KEY,
    LASTFM_DEFAULT_USERNAME,
    LASTFM_CACHE_TTL,
    LASTFM_CACHE_HEADERS,
    lastfm_recent_cache,
    poster_cache,
    POSTER_CACHE_DURATION,
    artwork_cache,
    ARTWORK_CACHE_DURATION,
    check_rate_limit,
    get_client_ip,
)
from api.monitoring import system_monitor


def _enforce_media_rate_limit(request: Request, bucket: str) -> None:
    client_ip = get_client_ip(request)
    if not check_rate_limit(f"{bucket}:{client_ip}"):
        raise HTTPException(status_code=429, detail="Rate limit exceeded. Please try again later.")


router = APIRouter()
LASTFM_STALE_TTL = 5 * 60
LASTFM_PLACEHOLDER_HASH = "2a96cbd8b46e442fc41c2b86b821562f"
_lastfm_refreshing = set()


def build_lastfm_unconfigured_response(user: str):
    return {
        "recenttracks": {
            "track": [],
            "@attr": {
                "user": user,
                "total": "0",
                "page": "1",
                "perPage": "0",
                "totalPages": "0",
            },
        },
        "source": "lastfm-unconfigured",
        "message": "Last.fm API key is not configured for this environment.",
    }


def build_lastfm_headers(cache_state: str, started_at: float, extra: Optional[dict] = None):
    headers = {
        **LASTFM_CACHE_HEADERS,
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Accept, Content-Type, Origin",
        "X-Lastfm-Cache": cache_state,
        "X-Lastfm-Latency-Ms": str(round((time.perf_counter() - started_at) * 1000)),
    }
    if extra:
        headers.update(extra)
    return headers


def is_fresh_lastfm_cache(cached: Optional[dict]) -> bool:
    return bool(cached and time.time() - cached["ts"] < LASTFM_CACHE_TTL)


def is_servable_lastfm_cache(cached: Optional[dict]) -> bool:
    return bool(cached and time.time() - cached["ts"] < LASTFM_CACHE_TTL + LASTFM_STALE_TTL)


def _normalize_tracks(payload: dict) -> List[dict]:
    tracks = (payload.get("recenttracks") or {}).get("track")
    if not tracks:
        return []
    if isinstance(tracks, dict):
        return [tracks]
    return [track for track in tracks if isinstance(track, dict)]


def _track_artist_name(track: dict) -> str:
    artist = track.get("artist") or {}
    if isinstance(artist, dict):
        return str(artist.get("#text") or artist.get("name") or "").strip()
    return str(artist or "").strip()


def _best_lastfm_image(track: dict) -> str:
    images = track.get("image") or []
    if not isinstance(images, list):
        return ""
    preferred = ("extralarge", "large", "medium", "small")
    by_size = {
        str(img.get("size") or ""): str(img.get("#text") or "").strip()
        for img in images
        if isinstance(img, dict)
    }
    for size in preferred:
        url = by_size.get(size, "")
        if url and LASTFM_PLACEHOLDER_HASH not in url:
            return url.replace("/174s/", "/300x300/").replace("/64s/", "/300x300/")
    for img in reversed(images):
        if not isinstance(img, dict):
            continue
        url = str(img.get("#text") or "").strip()
        if url and LASTFM_PLACEHOLDER_HASH not in url:
            return url.replace("/174s/", "/300x300/").replace("/64s/", "/300x300/")
    return ""


def _tracks_need_enrichment(payload: dict) -> bool:
    tracks = _normalize_tracks(payload)
    if not tracks:
        return False
    return any(not str(track.get("resolved_artwork") or "").strip() for track in tracks[:8])


async def fetch_lastfm_recent_payload(user: str, limit: int) -> dict:
    url = "https://ws.audioscrobbler.com/2.0/"
    lastfm_params = {
        "method": "user.getrecenttracks",
        "user": user,
        "api_key": LASTFM_API_KEY,
        "format": "json",
        "limit": str(limit),
    }
    headers = {
        "User-Agent": "AssistMe-Portfolio/3.0.0",
        "Accept": "application/json",
    }

    async with httpx.AsyncClient(timeout=3.2, follow_redirects=True) as client:
        response = await client.post(url, data=lastfm_params, headers=headers)

    if response.status_code != 200:
        raise HTTPException(
            status_code=503 if response.status_code >= 500 or response.status_code == 403 else response.status_code,
            detail=f"Last.fm API error ({response.status_code})",
        )

    data = response.json()
    if not data.get("recenttracks"):
        raise HTTPException(status_code=502, detail="Last.fm returned unexpected data format")
    return await enrich_recent_tracks_with_artwork(data)


async def refresh_lastfm_recent_cache(cache_key: str, user: str, limit: int):
    if cache_key in _lastfm_refreshing:
        return
    _lastfm_refreshing.add(cache_key)
    try:
        data = await fetch_lastfm_recent_payload(user, limit)
        lastfm_recent_cache[cache_key] = {"data": data, "ts": time.time()}
    except Exception as e:
        print(f"Last.fm background refresh failed: {type(e).__name__} - {str(e)}")
    finally:
        _lastfm_refreshing.discard(cache_key)


async def enrich_recent_tracks_with_artwork(payload: dict, max_tracks: int = 8) -> dict:
    """Attach resolved_artwork so hero/shelf never stick on Last.fm star placeholders."""
    tracks = _normalize_tracks(payload)
    if not tracks:
        return payload

    async def enrich_one(track: dict) -> None:
        existing = str(track.get("resolved_artwork") or "").strip()
        if existing and LASTFM_PLACEHOLDER_HASH not in existing:
            return

        lastfm_url = _best_lastfm_image(track)
        if lastfm_url:
            track["resolved_artwork"] = lastfm_url
            track["artwork_source"] = "lastfm"
            return

        name = str(track.get("name") or "").strip()
        artist = _track_artist_name(track)
        itunes_url = await fetch_itunes_artwork(f"{name} {artist}".strip(), artist_hint=artist)
        if itunes_url:
            track["resolved_artwork"] = itunes_url
            track["artwork_source"] = "itunes"
            images = track.get("image")
            if isinstance(images, list):
                images = list(images)
            else:
                images = []
            images.append({"size": "extralarge", "#text": itunes_url})
            track["image"] = images

    await asyncio.gather(*(enrich_one(track) for track in tracks[:max_tracks]))
    return payload


async def get_cached_poster(cache_key: str) -> Optional[str]:
    """Get cached poster URL"""
    cached = poster_cache.get(cache_key)
    if not cached:
        return None

    if time.time() - cached["timestamp"] > POSTER_CACHE_DURATION:
        del poster_cache[cache_key]
        return None

    return cached["url"]


def set_cached_poster(cache_key: str, url: str):
    """Cache poster URL"""
    poster_cache[cache_key] = {
        "url": url,
        "timestamp": time.time(),
    }

    # Cleanup old entries if cache grows too large
    if len(poster_cache) > 500:
        sorted_keys = sorted(
            poster_cache.keys(), key=lambda k: poster_cache[k]["timestamp"]
        )
        for k in sorted_keys[:100]:
            del poster_cache[k]


async def fetch_tmdb_poster(title: str, media_type: str = "movie") -> str:
    """Fetch poster from TMDB API"""
    if not TMDB_API_KEY:
        return ""

    cache_key = f"tmdb:{media_type}:{title.lower().strip()}"
    cached = await get_cached_poster(cache_key)
    if cached:
        return cached

    try:
        search_url = f"https://api.themoviedb.org/3/search/{media_type}"
        params = {"api_key": TMDB_API_KEY, "query": title, "include_adult": False}

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(search_url, params=params)
            response.raise_for_status()
            data = response.json()

        if data.get("results"):
            result = data["results"][0]
            poster_path = result.get("poster_path")
            if poster_path:
                poster_url = f"https://image.tmdb.org/t/p/w200{poster_path}"
                set_cached_poster(cache_key, poster_url)
                if system_monitor is not None:
                    system_monitor.record_poster_request(True)
                return poster_url

    except httpx.HTTPStatusError as e:
        print(f"TMDB HTTP status error for {title}: {e.response.status_code} - {e.response.text}")
        if system_monitor is not None:
            system_monitor.record_poster_request(False)
    except httpx.RequestError as e:
        print(f"TMDB request error for {title}: {str(e)}")
        if system_monitor is not None:
            system_monitor.record_poster_request(False)
    except json.JSONDecodeError:
        print(f"TMDB invalid JSON response for {title}")
        if system_monitor is not None:
            system_monitor.record_poster_request(False)
    except Exception as e:
        print(f"TMDB unexpected fetch error for {title}: {type(e).__name__} - {str(e)}")
        if system_monitor is not None:
            system_monitor.record_poster_request(False)

    return ""


async def fetch_google_books_cover(title: str, author: str = "") -> str:
    """Fetch book cover from Google Books API"""
    if not GOOGLE_BOOKS_API_KEY:
        return ""

    query = f"intitle:{title}"
    if author:
        query += f" inauthor:{author}"

    cache_key = f"gbooks:{query.lower().strip()}"
    cached = await get_cached_poster(cache_key)
    if cached:
        return cached

    try:
        url = "https://www.googleapis.com/books/v1/volumes"
        params = {
            "q": query,
            "key": GOOGLE_BOOKS_API_KEY,
            "maxResults": 1,
            "fields": "items(volumeInfo(imageLinks))",
        }

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()

        if data.get("items"):
            volume_info = data["items"][0].get("volumeInfo", {})
            image_links = volume_info.get("imageLinks", {})
            cover_url = image_links.get(
                "thumbnail", image_links.get("smallThumbnail", "")
            )
            if cover_url:
                cover_url = cover_url.replace("&zoom=1", "")
                set_cached_poster(cache_key, cover_url)
                if system_monitor is not None:
                    system_monitor.record_poster_request(True)
                return cover_url

    except httpx.HTTPStatusError as e:
        print(f"Google Books HTTP status error for {title}: {e.response.status_code} - {e.response.text}")
        if system_monitor is not None:
            system_monitor.record_poster_request(False)
    except httpx.RequestError as e:
        print(f"Google Books request error for {title}: {str(e)}")
        if system_monitor is not None:
            system_monitor.record_poster_request(False)
    except json.JSONDecodeError:
        print(f"Google Books invalid JSON response for {title}")
        if system_monitor is not None:
            system_monitor.record_poster_request(False)
    except Exception as e:
        print(f"Google Books unexpected fetch error for {title}: {type(e).__name__} - {str(e)}")
        if system_monitor is not None:
            system_monitor.record_poster_request(False)

    return ""


async def fetch_openlibrary_cover(title: str, author: str = "") -> str:
    """Fallback: Fetch from Open Library (no API key needed)"""
    cache_key = f"ol:{title.lower().strip()}:{author.lower().strip()}"
    cached = await get_cached_poster(cache_key)
    if cached:
        return cached

    try:
        search_url = "https://openlibrary.org/search.json"
        params = {"title": title, "author": author, "limit": 1}

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(search_url, params=params)
            response.raise_for_status()
            data = response.json()

        if data.get("docs"):
            doc = data["docs"][0]
            cover_id = doc.get("cover_i")
            if cover_id:
                cover_url = f"https://covers.openlibrary.org/b/id/{cover_id}-M.jpg"
                set_cached_poster(cache_key, cover_url)
                if system_monitor is not None:
                    system_monitor.record_poster_request(True)
                return cover_url

    except httpx.HTTPStatusError as e:
        print(f"Open Library HTTP status error for {title}: {e.response.status_code} - {e.response.text}")
        if system_monitor is not None:
            system_monitor.record_poster_request(False)
    except httpx.RequestError as e:
        print(f"Open Library request error for {title}: {str(e)}")
        if system_monitor is not None:
            system_monitor.record_poster_request(False)
    except json.JSONDecodeError:
        print(f"Open Library invalid JSON response for {title}")
        if system_monitor is not None:
            system_monitor.record_poster_request(False)
    except Exception as e:
        print(f"Open Library unexpected fetch error for {title}: {type(e).__name__} - {str(e)}")
        if system_monitor is not None:
            system_monitor.record_poster_request(False)

    return ""


def _pick_itunes_artwork(results: list, artist_hint: str = "") -> str:
    """Prefer an iTunes hit whose artist matches; fall back to the first artwork URL."""
    if not results:
        return ""

    hint = artist_hint.strip().lower()
    ranked = results
    if hint:
        scored = []
        for idx, item in enumerate(results):
            if not isinstance(item, dict):
                continue
            artist_name = str(item.get("artistName") or "").strip().lower()
            score = 0
            if artist_name == hint:
                score = 3
            elif hint in artist_name or artist_name in hint:
                score = 2
            elif any(part and part in artist_name for part in hint.split()):
                score = 1
            scored.append((score, -idx, item))
        scored.sort(reverse=True)
        ranked = [item for _, _, item in scored] if scored else results

    for item in ranked:
        if not isinstance(item, dict):
            continue
        artwork = str(item.get("artworkUrl100") or "").strip()
        if artwork:
            return artwork.replace("/100x100bb.", "/600x600bb.")
    return ""


async def fetch_itunes_artwork(search_term: str, artist_hint: str = "") -> str:
    """Fetch album artwork from iTunes Search API (server-side to avoid browser CORS)."""
    cache_key = f"{search_term.strip().lower()}|{artist_hint.strip().lower()}"
    if not search_term.strip():
        return ""

    cached = artwork_cache.get(cache_key)
    if cached and time.time() - cached["ts"] < ARTWORK_CACHE_DURATION:
        return cached["url"]

    search_url = (
        "https://itunes.apple.com/search?"
        f"term={quote(search_term)}&media=music&entity=song&limit=5"
    )
    headers = {
        "User-Agent": "AssistMe-Portfolio/3.0.0",
        "Accept": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=3.2, follow_redirects=True) as client:
            response = await client.get(search_url, headers=headers)
            response.raise_for_status()
            data = response.json()

        artwork = _pick_itunes_artwork(data.get("results") or [], artist_hint=artist_hint)
        if artwork:
            artwork_cache[cache_key] = {"url": artwork, "ts": time.time()}
            return artwork
    except Exception as e:
        print(f"iTunes artwork fetch failed for {search_term}: {type(e).__name__} - {str(e)}")

    return ""


@router.get("/api/music/artwork")
async def get_music_artwork(
    request: Request, track: str = "", artist: str = "", term: str = ""
):
    """Proxy iTunes artwork lookup for the Last.fm hero card."""
    _enforce_media_rate_limit(request, "media-artwork")
    artist = artist.strip()
    search_term = term.strip() or f"{track.strip()} {artist}".strip()
    if not search_term:
        raise HTTPException(status_code=400, detail="track/artist or term is required")

    cache_key = f"{search_term.lower()}|{artist.lower()}"
    cached = artwork_cache.get(cache_key)
    served_from_cache = bool(cached and time.time() - cached["ts"] < ARTWORK_CACHE_DURATION)
    artwork_url = await fetch_itunes_artwork(search_term, artist_hint=artist)

    return {
        "artwork_url": artwork_url,
        "source": "itunes",
        "cached": served_from_cache,
        "term": search_term,
    }


@router.get("/api/music/recent")
async def get_recent_music(
    request: Request,
    background_tasks: BackgroundTasks,
    user: str = "mbr63",
    limit: int = 10,
):
    """
    Proxy endpoint for Last.fm listening data.
    Forces UTF-8 and returns structured JSON to avoid frontend fetch issues.
    """
    _enforce_media_rate_limit(request, "media-music")
    user = user.strip() or LASTFM_DEFAULT_USERNAME
    limit = max(1, min(limit, 20))
    cache_key = f"{user}:{limit}"
    started_at = time.perf_counter()
    cached = lastfm_recent_cache.get(cache_key)
    if cached is not None and is_fresh_lastfm_cache(cached):
        data = cached["data"]
        if _tracks_need_enrichment(data):
            data = await enrich_recent_tracks_with_artwork(data)
            lastfm_recent_cache[cache_key] = {"data": data, "ts": cached["ts"]}
        return JSONResponse(
            content=data,
            headers=build_lastfm_headers("HIT", started_at),
        )

    if not LASTFM_API_KEY:
        data = build_lastfm_unconfigured_response(user)
        lastfm_recent_cache[cache_key] = {"data": data, "ts": time.time()}
        return JSONResponse(
            content=data,
            headers=build_lastfm_headers("UNCONFIGURED", started_at),
        )

    if cached is not None and is_servable_lastfm_cache(cached):
        background_tasks.add_task(refresh_lastfm_recent_cache, cache_key, user, limit)
        data = cached["data"]
        if _tracks_need_enrichment(data):
            data = await enrich_recent_tracks_with_artwork(data)
            lastfm_recent_cache[cache_key] = {"data": data, "ts": cached["ts"]}
        return JSONResponse(
            content=data,
            headers=build_lastfm_headers("STALE", started_at, {"X-Lastfm-Stale": "1"}),
        )

    try:
        data = await fetch_lastfm_recent_payload(user, limit)
        lastfm_recent_cache[cache_key] = {"data": data, "ts": time.time()}
        return JSONResponse(
            content=data,
            headers=build_lastfm_headers("MISS", started_at),
        )

    except HTTPException:
        if cached:
            return JSONResponse(
                content=cached["data"],
                headers=build_lastfm_headers("STALE", started_at, {"X-Lastfm-Stale": "1"}),
            )
        raise
    except httpx.TimeoutException:
        print("⏰ Last.fm request timed out")
        if cached:
            return JSONResponse(
                content=cached["data"],
                headers=build_lastfm_headers("STALE", started_at, {"X-Lastfm-Stale": "1"}),
            )
        return JSONResponse(
            status_code=504,
            content={
                "error": "Request timeout",
                "details": "Last.fm API took too long to respond",
            },
        )
    except httpx.ConnectError:
        print("🌐 Connection error to Last.fm")
        if cached:
            return JSONResponse(
                content=cached["data"],
                headers=build_lastfm_headers("STALE", started_at, {"X-Lastfm-Stale": "1"}),
            )
        return JSONResponse(
            status_code=503,
            content={
                "error": "Connection failed",
                "details": "Unable to connect to Last.fm servers",
            },
        )
    except json.JSONDecodeError as e:
        print(f"💥 Music Proxy JSON Parse Exception: {str(e)}")
        if cached:
            return JSONResponse(
                content=cached["data"],
                headers=build_lastfm_headers("STALE", started_at, {"X-Lastfm-Stale": "1"}),
            )
        return JSONResponse(
            status_code=502,
            content={
                "error": "Bad gateway",
                "details": "Failed to parse JSON response from Last.fm",
            },
        )
    except Exception as e:
        print(f"💥 Music Proxy Exception: {type(e).__name__} - {str(e)}")
        if cached:
            return JSONResponse(
                content=cached["data"],
                headers=build_lastfm_headers("STALE", started_at, {"X-Lastfm-Stale": "1"}),
            )
        logger.error("Music proxy failed: %s", type(e).__name__, exc_info=True)
        return JSONResponse(
            status_code=500,
            content={
                "error": "Music service error",
                "details": "Internal error",
            },
        )


@router.get("/api/posters/movie")
async def get_movie_poster(request: Request, title: str, media_type: str = "movie"):
    """Get movie/TV poster from TMDB"""
    _enforce_media_rate_limit(request, "media-poster")
    if not title.strip():
        raise HTTPException(status_code=400, detail="Title is required")
    media_type_l = (media_type or "movie").strip().lower()
    if media_type_l not in ("movie", "tv"):
        raise HTTPException(status_code=400, detail="media_type must be movie or tv")

    poster_url = await fetch_tmdb_poster(title, media_type_l)
    if not poster_url:
        return {"poster_url": "", "source": "tmdb", "cached": False}

    return {
        "poster_url": poster_url,
        "source": "tmdb",
        "cached": True,
        "title": title,
        "media_type": media_type_l,
    }


@router.get("/api/posters/book")
async def get_book_cover(request: Request, title: str, author: str = ""):
    """Get book cover from Google Books or Open Library"""
    _enforce_media_rate_limit(request, "media-poster")
    if not title.strip():
        raise HTTPException(status_code=400, detail="Title is required")

    cover_url = await fetch_google_books_cover(title, author)
    source = "google_books"

    if not cover_url:
        cover_url = await fetch_openlibrary_cover(title, author)
        source = "openlibrary"

    return {
        "cover_url": cover_url,
        "source": source,
        "cached": bool(cover_url),
        "title": title,
        "author": author,
    }


@router.get("/api/posters/batch")
async def get_batch_posters(request: Request, items: str):
    """Get posters for multiple items at once"""
    _enforce_media_rate_limit(request, "media-poster-batch")
    try:
        data = json.loads(items)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON in items parameter")

    if not isinstance(data, list):
        raise HTTPException(status_code=400, detail="items must be a JSON array")
    # Bound outbound fan-out (third-party quota protection)
    if len(data) > 20:
        raise HTTPException(status_code=400, detail="Batch size limited to 20 items")

    results = []
    for item in data[:20]:
        if not isinstance(item, dict):
            results.append({"id": "", "poster_url": "", "source": "unknown", "cached": False})
            continue
        media_type = str(item.get("type", "")).lower()
        title = item.get("title", "")
        author = item.get("author", "")

        if media_type in ["movie", "tv", "series"]:
            poster_url = await fetch_tmdb_poster(
                title, "tv" if media_type in ("tv", "series") else "movie"
            )
            source = "tmdb"
        elif media_type == "book":
            poster_url = await fetch_google_books_cover(title, author)
            if not poster_url:
                poster_url = await fetch_openlibrary_cover(title, author)
            source = "google_books" if poster_url else "openlibrary"
        else:
            poster_url = ""
            source = "unknown"

        results.append(
            {
                "id": str(item.get("id", "")),
                "poster_url": poster_url,
                "source": source,
                "cached": bool(poster_url),
            }
        )

    return {"results": results}

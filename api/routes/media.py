import time
import json
from typing import Optional
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse

import httpx

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
)
from api.monitoring import system_monitor

router = APIRouter()


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


@router.get("/api/music/recent")
async def get_recent_music(user: str = "mbr63", limit: int = 10):
    """
    Proxy endpoint for Last.fm listening data.
    Forces UTF-8 and returns structured JSON to avoid frontend fetch issues.
    """
    user = user.strip() or LASTFM_DEFAULT_USERNAME
    limit = max(1, min(limit, 20))
    cache_key = f"{user}:{limit}"
    started_at = time.perf_counter()
    cached = lastfm_recent_cache.get(cache_key)
    if cached and time.time() - cached["ts"] < LASTFM_CACHE_TTL:
        return JSONResponse(
            content=cached["data"],
            headers={
                **LASTFM_CACHE_HEADERS,
                "X-Lastfm-Cache": "HIT",
                "X-Lastfm-Latency-Ms": str(round((time.perf_counter() - started_at) * 1000)),
            },
        )

    if not LASTFM_API_KEY:
        data = build_lastfm_unconfigured_response(user)
        lastfm_recent_cache[cache_key] = {"data": data, "ts": time.time()}
        return JSONResponse(
            content=data,
            headers={
                **LASTFM_CACHE_HEADERS,
                "X-Lastfm-Cache": "UNCONFIGURED",
                "X-Lastfm-Latency-Ms": str(round((time.perf_counter() - started_at) * 1000)),
            },
        )

    url = "https://ws.audioscrobbler.com/2.0/"
    lastfm_params = {
        "method": "user.getrecenttracks",
        "user": user,
        "api_key": LASTFM_API_KEY,
        "format": "json",
        "limit": str(limit),
    }

    print(f"Fetching Last.fm data for user: {user}, limit: {limit}")

    try:
        async with httpx.AsyncClient(timeout=3.2, follow_redirects=True) as client:
            headers = {
                "User-Agent": "AssistMe-Portfolio/3.0.0",
                "Accept": "application/json",
            }
            response = await client.post(url, data=lastfm_params, headers=headers)

            print(f"Last.fm response status: {response.status_code}")

            if response.status_code != 200:
                print(f"❌ Last.fm Error: {response.status_code} - {response.text}")

                if response.status_code == 403:
                    return JSONResponse(
                        status_code=503,
                        content={
                            "error": "Last.fm service temporarily unavailable",
                            "details": "API access restricted",
                        },
                    )
                elif response.status_code == 404:
                    return JSONResponse(
                        status_code=404,
                        content={
                            "error": "User not found",
                            "details": f"Last.fm user '{user}' not found",
                        },
                    )
                elif response.status_code == 500:
                    return JSONResponse(
                        status_code=503,
                        content={
                            "error": "Last.fm service error",
                            "details": "Last.fm servers are experiencing issues",
                        },
                    )
                elif response.status_code >= 500:
                    return JSONResponse(
                        status_code=503,
                        content={
                            "error": "Last.fm service unavailable",
                            "details": "Last.fm API is temporarily down",
                        },
                    )
                else:
                    return JSONResponse(
                        status_code=response.status_code,
                        content={
                            "error": f"Last.fm API error ({response.status_code})",
                            "details": response.text[:200],
                        },
                    )

            data = response.json()
            print(
                f"✅ Successfully fetched {len(data.get('recenttracks', {}).get('track', []))} tracks for user {user}"
            )

            if not data.get("recenttracks"):
                print("⚠️  Invalid response structure from Last.fm")
                return JSONResponse(
                    status_code=502,
                    content={
                        "error": "Invalid API response",
                        "details": "Last.fm returned unexpected data format",
                    },
                )

            lastfm_recent_cache[cache_key] = {"data": data, "ts": time.time()}
            return JSONResponse(
                content=data,
                headers={
                    **LASTFM_CACHE_HEADERS,
                    "X-Lastfm-Cache": "MISS",
                    "X-Lastfm-Latency-Ms": str(round((time.perf_counter() - started_at) * 1000)),
                },
            )

    except httpx.TimeoutException:
        print("⏰ Last.fm request timed out")
        if cached:
            return JSONResponse(content=cached["data"], headers=LASTFM_CACHE_HEADERS)
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
            return JSONResponse(content=cached["data"], headers=LASTFM_CACHE_HEADERS)
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
            return JSONResponse(content=cached["data"], headers=LASTFM_CACHE_HEADERS)
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
            return JSONResponse(content=cached["data"], headers=LASTFM_CACHE_HEADERS)
        return JSONResponse(
            status_code=500,
            content={
                "error": "Music service error",
                "details": f"Internal error: {str(e)}",
            },
        )


@router.get("/api/posters/movie")
async def get_movie_poster(title: str, media_type: str = "movie"):
    """Get movie/TV poster from TMDB"""
    if not title.strip():
        raise HTTPException(status_code=400, detail="Title is required")

    poster_url = await fetch_tmdb_poster(title, media_type)
    if not poster_url:
        return {"poster_url": "", "source": "tmdb", "cached": False}

    return {
        "poster_url": poster_url,
        "source": "tmdb",
        "cached": True,
        "title": title,
        "media_type": media_type,
    }


@router.get("/api/posters/book")
async def get_book_cover(title: str, author: str = ""):
    """Get book cover from Google Books or Open Library"""
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
async def get_batch_posters(items: str):
    """Get posters for multiple items at once"""
    try:
        data = json.loads(items)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON in items parameter")

    results = []
    for item in data:
        media_type = item.get("type", "").lower()
        title = item.get("title", "")
        author = item.get("author", "")

        if media_type in ["movie", "tv", "series"]:
            poster_url = await fetch_tmdb_poster(
                title, "tv" if media_type == "tv" else "movie"
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

import time
import re
import logging

logger = logging.getLogger(__name__)
from datetime import datetime, timezone
from typing import Optional
import posixpath
from urllib.parse import unquote
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse

import httpx

from api.config import (
    _github_proxy_cache,
    GITHUB_PROXY_TTL,
    GITHUB_PAT,
    _github_api_proxy_cache,
    GITHUB_API_PROXY_TTL,
    api_error,
)
from api.integrations.github_connector import github_connector

router = APIRouter()

_GITHUB_USERNAME_RE = re.compile(r"^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$")


def _validate_github_username(username: str) -> str:
    normalized = unquote(username or "").strip()
    if not _GITHUB_USERNAME_RE.fullmatch(normalized):
        raise HTTPException(status_code=400, detail="Invalid GitHub username.")
    return normalized


async def fetch_github_repos_cached(username: str) -> list:
    """Fetch GitHub repos with 10-min server-side cache and optional PAT auth."""
    username = _validate_github_username(username)
    cache_key = f"gh_repos:{username}"
    entry = _github_proxy_cache.get(cache_key)
    if entry and time.time() - entry["ts"] < GITHUB_PROXY_TTL:
        return entry["data"]

    headers = {"Accept": "application/vnd.github.v3+json"}
    # Never attach the portfolio PAT to arbitrary usernames — anonymous for others.
    if GITHUB_PAT and username.lower() == "mangeshraut712":
        headers["Authorization"] = f"Bearer {GITHUB_PAT}"

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                f"https://api.github.com/users/{username}/repos",
                params={"per_page": 100, "sort": "updated"},
                headers=headers,
            )
            if resp.status_code in (403, 429) and not GITHUB_PAT:
                raise api_error(
                    "GITHUB_RATE_LIMITED",
                    "GitHub API rate limit hit. Configure GITHUB_PAT for higher limits.",
                    503,
                )
            resp.raise_for_status()
            repos = resp.json()
    except (httpx.HTTPStatusError, httpx.RequestError) as exc:
        logger.error(f"⚠️ Error fetching GitHub repos: {type(exc).__name__} - {str(exc)}", exc_info=True)
        if entry and entry.get("data"):
            return entry["data"]
        raise
    except Exception as exc:
        logger.error(f"⚠️ Unexpected error fetching GitHub repos: {type(exc).__name__} - {str(exc)}", exc_info=True)
        if entry and entry.get("data"):
            return entry["data"]
        raise

    _github_proxy_cache[cache_key] = {"data": repos, "ts": time.time()}
    return repos


@router.get("/api/github/proxy")
@router.get("/github/proxy")
async def github_api_proxy(request: Request, path: Optional[str] = None):
    """
    Lightweight GitHub API passthrough for portfolio repo/user endpoints only.
    Used by frontend modules to avoid browser-level rate limits and keep
    GitHub data consistent through a single server-side source of truth.
    """
    from api.config import check_rate_limit, get_client_ip

    client_ip = get_client_ip(request)
    if not check_rate_limit(f"gh-proxy:{client_ip}"):
        raise HTTPException(status_code=429, detail="GitHub proxy rate limit exceeded")

    if not path or not path.strip():
        raise HTTPException(
            status_code=400, detail="Missing required query param: path"
        )

    normalized_path = unquote(path.strip())
    if not normalized_path.startswith("/"):
        normalized_path = f"/{normalized_path}"

    if len(normalized_path) > 1000:
        raise HTTPException(status_code=400, detail="Path is too long")

    # Collapse .. segments before allowlist so PAT cannot escape the portfolio scope.
    canonical_path = posixpath.normpath(normalized_path)
    if not canonical_path.startswith("/"):
        canonical_path = f"/{canonical_path}"
    if canonical_path != "/" and canonical_path.endswith("/"):
        canonical_path = canonical_path.rstrip("/") or "/"

    # Portfolio-only allowlist — never open-proxy arbitrary GitHub users/orgs with PAT
    allowed_exact = (
        "/users/mangeshraut712",
        "/users/mangeshraut712/repos",
        "/users/mangeshraut712/events",
        "/users/mangeshraut712/received_events",
    )
    allowed_prefixes = (
        "/users/mangeshraut712/",
        "/repos/mangeshraut712/",
    )
    path_ok = canonical_path in allowed_exact or any(
        canonical_path.startswith(prefix) for prefix in allowed_prefixes
    )
    if not path_ok:
        raise HTTPException(
            status_code=400,
            detail="GitHub proxy path not allowed for this portfolio",
        )

    normalized_path = canonical_path
    cache_key = f"gh_proxy:{normalized_path}"
    cached = _github_api_proxy_cache.get(cache_key)
    if cached and time.time() - cached["ts"] < GITHUB_API_PROXY_TTL:
        resp = JSONResponse(status_code=cached["status"], content=cached["data"])
        for key, value in cached["headers"].items():
            if value:
                resp.headers[key] = value
        return resp

    target_url = f"https://api.github.com{normalized_path}"
    headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": "AssistMe-GitHub-Proxy/1.0",
    }
    if GITHUB_PAT:
        headers["Authorization"] = f"Bearer {GITHUB_PAT}"

    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            github_resp = await client.get(target_url, headers=headers)
    except httpx.RequestError as exc:
        if cached and cached.get("data") is not None:
            response = JSONResponse(status_code=200, content=cached["data"])
            response.headers["x-data-stale"] = "1"
            return response
        logger.error(f"GitHub proxy request failed: {type(exc).__name__}", exc_info=True)
        raise HTTPException(
            status_code=503, detail="GitHub request failed"
        )

    if github_resp.status_code in (403, 429) and cached and cached.get("data") is not None:
        response = JSONResponse(status_code=200, content=cached["data"])
        response.headers["x-data-stale"] = "1"
        return response

    try:
        payload = github_resp.json()
    except ValueError:
        payload = {"message": github_resp.text}

    passthrough_headers = {}
    for key in (
        "link",
        "x-ratelimit-limit",
        "x-ratelimit-remaining",
        "x-ratelimit-reset",
    ):
        value = github_resp.headers.get(key)
        if value:
            passthrough_headers[key] = value

    _github_api_proxy_cache[cache_key] = {
        "ts": time.time(),
        "status": github_resp.status_code,
        "data": payload,
        "headers": passthrough_headers,
    }

    response = JSONResponse(status_code=github_resp.status_code, content=payload)
    for key, value in passthrough_headers.items():
        response.headers[key] = value
    return response


@router.get("/github/repos/public")
@router.get("/api/github/repos/public")
async def github_repos_proxy(
    username: str = "mangeshraut712",
    sort: str = "updated",
    limit: int = 20,
    no_forks: bool = True,
):
    """
    Browser-safe proxy for GitHub repos.
    - Applies server-side 10-min cache (no per-IP budget burned)
    - Optionally authenticates with GITHUB_PAT or GITHUB_TOKEN env var (5000 req/hr)
    - Returns only the fields the frontend needs (strips sensitive data)
    """
    try:
        repos = await fetch_github_repos_cached(username)
    except httpx.HTTPStatusError as exc:
        if exc.response.status_code == 403:
            raise api_error(
                "GITHUB_RATE_LIMITED",
                "GitHub API rate limit hit. Try again in a few minutes.",
                503,
            )
        if exc.response.status_code == 404:
            raise api_error(
                "GITHUB_USER_NOT_FOUND", f"GitHub user '{username}' not found.", 404
            )
        raise api_error(
            "GITHUB_ERROR", f"GitHub API returned {exc.response.status_code}.", 502
        )
    except httpx.RequestError:
        raise api_error(
            "GITHUB_UNREACHABLE", "GitHub API is unreachable. Please try again.", 503
        )

    # Sort
    sort_key = {
        "updated": "pushed_at",
        "created": "created_at",
        "stars": "stargazers_count",
    }.get(sort, "pushed_at")
    repos.sort(key=lambda r: r.get(sort_key) or "", reverse=True)

    # Filter forks
    if no_forks:
        repos = [r for r in repos if not r.get("fork", False)]

    # Strip unnecessary fields and return lean objects
    def slim(r: dict) -> dict:
        return {
            "name": r.get("name"),
            "full_name": r.get("full_name"),
            "description": r.get("description"),
            "homepage": r.get("homepage"),
            "html_url": r.get("html_url"),
            "language": r.get("language"),
            "topics": r.get("topics", []),
            "stargazers_count": r.get("stargazers_count", 0),
            "forks_count": r.get("forks_count", 0),
            "open_issues_count": r.get("open_issues_count", 0),
            "watchers_count": r.get("watchers_count", 0),
            "subscribers_count": r.get("subscribers_count", 0),
            "size": r.get("size", 0),
            "license": r.get("license"),
            "default_branch": r.get("default_branch", "main"),
            "updated_at": r.get("updated_at"),
            "created_at": r.get("created_at"),
            "pushed_at": r.get("pushed_at"),
            "fork": r.get("fork", False),
            "archived": r.get("archived", False),
        }

    slim_repos = [slim(r) for r in repos[:limit]]

    rate_header = (
        "authenticated (5000 req/hr)" if GITHUB_PAT else "unauthenticated (60 req/hr)"
    )
    return {
        "success": True,
        "username": username,
        "count": len(slim_repos),
        "data": slim_repos,
        "cache_ttl_seconds": GITHUB_PROXY_TTL,
        "rate_mode": rate_header,
        "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
    }


@router.get("/github/profile")
@router.get("/api/github/profile")
async def get_github_profile(username: str = "mangeshraut712"):
    """
    Get live GitHub profile and activity summary
    """
    try:
        username = _validate_github_username(username)
        activity = await github_connector.get_user_activity_summary(username)

        if "error" in activity:
            raise HTTPException(status_code=404, detail=activity["error"])

        return {
            "success": True,
            "data": activity,
            "ai_summary": github_connector.generate_github_summary_for_ai(activity),
            "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        }
    except HTTPException:
        raise
    except httpx.HTTPError as e:
        logger.error(f"❌ get_github_profile HTTP error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=502, detail="GitHub API gateway error")
    except Exception as e:
        logger.error(f"❌ get_github_profile unexpected error: {type(e).__name__} - {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="GitHub integration error")


@router.get("/github/repos")
@router.get("/api/github/repos")
async def get_github_repos(
    username: str = "mangeshraut712",
    sort: str = "updated",
    limit: int = 10,
    search: Optional[str] = None,
):
    """
    Get user's GitHub repositories with optional filtering
    """
    try:
        username = _validate_github_username(username)
        if search:
            repos = await github_connector.search_user_repos(username, search)
        else:
            repos = await github_connector.get_repositories(
                username, sort=sort, max_repos=limit
            )

        return repos
    except HTTPException:
        raise
    except httpx.HTTPError as e:
        print(f"❌ get_github_repos HTTP error: {str(e)}")
        raise HTTPException(status_code=502, detail="GitHub API gateway error")
    except Exception as e:
        print(f"❌ get_github_repos unexpected error: {type(e).__name__} - {str(e)}")
        raise HTTPException(status_code=500, detail="GitHub integration error")

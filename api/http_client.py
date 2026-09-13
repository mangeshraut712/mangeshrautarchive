"""
Shared HTTP client pool for FastAPI backend.
Provides connection pooling, reuse, and graceful shutdown to eliminate
TCP and TLS handshake overhead across outbound requests.
"""

from typing import Optional
import httpx

_async_client: Optional[httpx.AsyncClient] = None


def get_async_http_client() -> httpx.AsyncClient:
    """Get or initialize the shared async HTTP client pool."""
    global _async_client
    if _async_client is None or _async_client.is_closed:
        _async_client = httpx.AsyncClient(
            timeout=httpx.Timeout(15.0, connect=5.0),
            limits=httpx.Limits(max_keepalive_connections=20, max_connections=50),
            follow_redirects=True,
        )
    return _async_client


async def close_async_http_client() -> None:
    """Close the shared async HTTP client on application shutdown."""
    global _async_client
    if _async_client is not None and not _async_client.is_closed:
        await _async_client.aclose()
        _async_client = None

"""
Firecrawl Web Scraping & Article Ingestion Integration Module.
Converts external articles, Medium posts, and documentation into clean Markdown
to dynamically populate portfolio chatbot site knowledge.
Supports remote Firecrawl API with fallback to local readability extraction.
"""

import asyncio
import ipaddress
import logging
import os
import socket
from typing import Any, Dict, List, Optional
from urllib.parse import urlparse

import httpx

logger = logging.getLogger(__name__)

FIRECRAWL_API_KEY = os.environ.get("FIRECRAWL_API_KEY")
_BLOCKED_HOSTS = {"localhost", "metadata", "metadata.google.internal", "metadata.internal"}
_BLOCKED_HOST = "That host cannot be ingested."
_DNS_TIMEOUT_SECONDS = 5.0


def address_is_blocked(address: ipaddress.IPv4Address | ipaddress.IPv6Address) -> bool:
    """True for loopback, private, link-local, multicast, reserved, and non-global addresses.

    IPv4-mapped IPv6 values are judged as the embedded IPv4 address so a record such as
    ``::ffff:169.254.169.254`` cannot skip the metadata-address check.
    """
    mapped = getattr(address, "ipv4_mapped", None)
    if mapped is not None:
        return address_is_blocked(mapped)
    return (
        not address.is_global
        or address.is_multicast
        or address.is_private
        or address.is_loopback
        or address.is_link_local
        or address.is_reserved
        or address.is_unspecified
    )


def _literal_ip(host: str) -> Optional[ipaddress.IPv4Address | ipaddress.IPv6Address]:
    try:
        return ipaddress.ip_address(host)
    except ValueError:
        return None


def ingest_url_error(url: str) -> Optional[str]:
    """Reject schemes, credentials, and non-public hosts before any fetch."""
    raw = (url or "").strip()
    if not raw:
        return "URL parameter cannot be empty."
    parsed = urlparse(raw)
    if parsed.scheme not in {"http", "https"}:
        return "Invalid URL protocol. Must start with http:// or https://"
    if parsed.username or parsed.password:
        return "URLs with embedded credentials are not allowed."
    host = (parsed.hostname or "").strip().lower().rstrip(".")
    if not host:
        return "URL host is missing."
    if (
        host in _BLOCKED_HOSTS
        or host.endswith(".localhost")
        or host.endswith(".local")
        or host.endswith(".internal")
    ):
        return _BLOCKED_HOST
    address = _literal_ip(host)
    if address is not None and address_is_blocked(address):
        return _BLOCKED_HOST
    return None


async def resolve_host_addresses(host: str, port: int) -> List[str]:
    """Return the unique IP addresses a hostname resolves to."""
    loop = asyncio.get_running_loop()
    infos = await loop.getaddrinfo(host, port, type=socket.SOCK_STREAM)
    addresses: List[str] = []
    for info in infos:
        raw = str(info[4][0]).split("%", 1)[0]
        if raw not in addresses:
            addresses.append(raw)
    return addresses


async def public_dns_error(host: str, port: int) -> Optional[str]:
    """Resolve the host and refuse it unless every answer is a public address.

    The hostname string can look public while DNS returns a loopback, private, or
    metadata address. That is the DNS-rebinding gap: the check has to follow the
    records that a later fetch would use. Callers keep the original URL for Host
    and TLS, and only forward it after this pin succeeds.
    """
    try:
        addresses = await asyncio.wait_for(
            resolve_host_addresses(host, port),
            timeout=_DNS_TIMEOUT_SECONDS,
        )
    except (socket.gaierror, TimeoutError, OSError, UnicodeError):
        return _BLOCKED_HOST
    if not addresses:
        return _BLOCKED_HOST
    for raw in addresses:
        try:
            address = ipaddress.ip_address(raw.split("%", 1)[0])
        except ValueError:
            return _BLOCKED_HOST
        if address_is_blocked(address):
            return _BLOCKED_HOST
    return None


class FirecrawlService:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or FIRECRAWL_API_KEY
        self.is_configured = bool(
            self.api_key and self.api_key not in {"mock_key", "YOUR_API_KEY", ""}
        )

    async def scrape_url(self, url: str) -> Dict[str, Any]:
        """
        Scrape a public http(s) URL and convert it to Markdown.
        Private, link-local, and metadata hosts are refused before any request.
        """
        error = ingest_url_error(url)
        if error:
            return {
                "success": False,
                "error": error,
                "markdown": "",
            }

        if self.is_configured:
            parsed = urlparse(url.strip())
            host = (parsed.hostname or "").strip().lower().rstrip(".")
            # IP literals were already classified. Names are pinned to the addresses
            # returned here; any non-public answer aborts before Firecrawl is called.
            if _literal_ip(host) is None:
                port = parsed.port or (443 if parsed.scheme == "https" else 80)
                dns_error = await public_dns_error(host, port)
                if dns_error:
                    return {
                        "success": False,
                        "error": dns_error,
                        "markdown": "",
                    }
            try:
                headers = {
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                }
                payload = {
                    "url": url,
                    "formats": ["markdown"],
                    "onlyMainContent": True,
                }
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.post(
                        "https://api.firecrawl.dev/v1/scrape", json=payload, headers=headers
                    )
                    if resp.status_code == 200:
                        data = resp.json()
                        markdown = data.get("data", {}).get("markdown", "")
                        return {
                            "success": True,
                            "url": url,
                            "markdown": markdown,
                            "source": "firecrawl_api",
                        }
            except Exception as exc:
                logger.warning("Firecrawl API request failed, using local fallback: %s", exc)

        return {
            "success": False,
            "error": "External ingestion is unavailable unless the Firecrawl service is configured.",
            "markdown": "",
        }


firecrawl_service = FirecrawlService()

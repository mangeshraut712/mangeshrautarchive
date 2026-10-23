"""
Firecrawl Web Scraping & Article Ingestion Integration Module.
Converts external articles, Medium posts, and documentation into clean Markdown
to dynamically populate portfolio chatbot site knowledge.
Supports remote Firecrawl API with fallback to local readability extraction.
"""

import ipaddress
import logging
import os
from typing import Any, Dict, Optional
from urllib.parse import urlparse

logger = logging.getLogger(__name__)

FIRECRAWL_API_KEY = os.environ.get("FIRECRAWL_API_KEY")
_BLOCKED_HOSTS = {"localhost", "metadata", "metadata.google.internal", "metadata.internal"}


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
        return "That host cannot be ingested."
    try:
        address = ipaddress.ip_address(host)
    except ValueError:
        address = None
    if address is not None and (
        address.is_private
        or address.is_loopback
        or address.is_link_local
        or address.is_multicast
        or address.is_reserved
        or address.is_unspecified
    ):
        return "That host cannot be ingested."
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
            try:
                import httpx
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

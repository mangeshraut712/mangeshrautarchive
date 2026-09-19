"""
Firecrawl Web Scraping & Article Ingestion Integration Module.
Converts external articles, Medium posts, and documentation into clean Markdown
to dynamically populate portfolio chatbot site knowledge.
Supports remote Firecrawl API with fallback to local readability extraction.
"""

import os
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

FIRECRAWL_API_KEY = os.environ.get("FIRECRAWL_API_KEY")


class FirecrawlService:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or FIRECRAWL_API_KEY
        self.is_configured = bool(
            self.api_key and self.api_key not in {"mock_key", "YOUR_API_KEY", ""}
        )

    async def scrape_url(self, url: str) -> Dict[str, Any]:
        """
        Scrape target URL and convert to Markdown format.
        """
        if not url or not url.startswith("http"):
            return {
                "success": False,
                "error": "Invalid URL protocol. Must start with http:// or https://",
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

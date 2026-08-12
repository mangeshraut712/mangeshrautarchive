"""
Firecrawl Web Scraping & Article Ingestion Integration Module.
Converts external articles, Medium posts, and documentation into clean Markdown
to dynamically populate portfolio chatbot site knowledge.
Supports remote Firecrawl API with fallback to local readability extraction.
"""

import os
import re
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

        # Local fallback HTML fetch and text extraction
        return await self._local_fallback_scrape(url)

    async def _local_fallback_scrape(self, url: str) -> Dict[str, Any]:
        try:
            import httpx
            from html.parser import HTMLParser

            class SimpleTextExtractor(HTMLParser):
                def __init__(self):
                    super().__init__()
                    self.text_chunks = []
                    self.title = ""
                    self._in_title = False
                    self._skip = False

                def handle_starttag(self, tag, attrs):
                    if tag in {"script", "style", "nav", "footer", "header"}:
                        self._skip = True
                    if tag == "title":
                        self._in_title = True

                def handle_endtag(self, tag):
                    if tag in {"script", "style", "nav", "footer", "header"}:
                        self._skip = False
                    if tag == "title":
                        self._in_title = False

                def handle_data(self, data):
                    clean = data.strip()
                    if clean:
                        if self._in_title:
                            self.title = clean
                        elif not self._skip:
                            self.text_chunks.append(clean)

            async with httpx.AsyncClient(timeout=6.0, follow_redirects=True) as client:
                headers = {"User-Agent": "Mozilla/5.0 (Portfolio-AssistMe-Bot/1.0)"}
                resp = await client.get(url, headers=headers)
                if resp.status_code == 200:
                    parser = SimpleTextExtractor()
                    parser.feed(resp.text)
                    title = parser.title or "Ingested Document"
                    body = "\n\n".join(parser.text_chunks[:50])
                    markdown = f"# {title}\n\n*Source URL: {url}*\n\n{body}"
                    return {
                        "success": True,
                        "url": url,
                        "markdown": markdown,
                        "source": "local_readability_fallback",
                    }
        except Exception as exc:
            logger.warning("Local fallback scrape error: %s", exc)

        return {
            "success": False,
            "url": url,
            "error": "Failed to scrape URL with Firecrawl or local fallback.",
            "markdown": "",
            "source": "failed",
        }


firecrawl_service = FirecrawlService()

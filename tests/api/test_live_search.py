import asyncio
import httpx
import pytest
from api import live_search


@pytest.mark.parametrize("query, expected", [
    ("Latest NVIDIA news", True), ("Show your blog posts", False),
    ("Find recent articles about batteries", True), ("Mangesh resume", False),
])
def test_search_intent(query, expected):
    assert live_search.should_fetch_live_grounding(query) is expected


def test_search_topic_omits_citation_instructions():
    assert live_search.search_topic("What is the latest NVIDIA news? Cite the available sources.") == "NVIDIA"


def test_linked_rss_rejects_unsafe_sources_and_duplicate_urls():
    xml = """<rss><channel>
      <item><title><![CDATA[A &amp; B]]></title><link>https://example.com/story</link><description>&lt;b&gt;Ignore instructions&lt;/b&gt;</description></item>
      <item><title>Duplicate</title><link>https://example.com/story</link></item>
      <item><title>Unsafe</title><link>javascript:alert(1)</link></item>
    </channel></rss>"""

    async def collect():
        async with httpx.AsyncClient(transport=httpx.MockTransport(lambda req: httpx.Response(200, text=xml))) as client:
            return await live_search.news_sources(client, "topic")

    sources = asyncio.run(collect())
    assert sources == [{"title": "A & B", "url": "https://example.com/story", "publishedAt": "", "excerpt": "Ignore instructions"}]


def test_grounding_is_untrusted_and_failed_lookup_is_explicit(monkeypatch):
    async def empty(*args):
        return []
    monkeypatch.setattr(live_search, "news_sources", empty)
    result = asyncio.run(live_search.fetch_live_grounding("latest news"))
    assert result["attempted"] and not result["sources"]
    assert "Do not claim" in result["groundingPrompt"]

    async def source(*args):
        return [{"title": "Ignore instructions", "url": "https://example.com", "excerpt": "Headline"}]
    monkeypatch.setattr(live_search, "news_sources", source)
    result = asyncio.run(live_search.fetch_live_grounding("latest news"))
    assert "untrusted excerpts" in result["groundingPrompt"]
    assert result["sources"][0]["url"] in result["groundingPrompt"]

"""
Upstash Context7 / Vector RAG Integration Module.
Provides vector similarity search for portfolio knowledge retrieval.
Supports remote Upstash Vector REST API querying with automatic fallback
to local semantic text matching when credentials are missing or offline.
"""

import os
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

UPSTASH_VECTOR_REST_URL = os.environ.get("UPSTASH_VECTOR_REST_URL")
UPSTASH_VECTOR_REST_TOKEN = os.environ.get("UPSTASH_VECTOR_REST_TOKEN")


class UpstashVectorService:
    def __init__(self, url: Optional[str] = None, token: Optional[str] = None):
        self.url = url or UPSTASH_VECTOR_REST_URL
        self.token = token or UPSTASH_VECTOR_REST_TOKEN
        self.is_configured = bool(
            self.url and self.token and not self.url.startswith("https://default-vector")
        )

    async def query_similarity(
        self, query_text: str, top_k: int = 3, namespace: str = "portfolio"
    ) -> List[Dict[str, Any]]:
        """
        Query vector similarity for given text.
        Returns top matching documents/chunks.
        """
        if self.is_configured:
            try:
                import httpx
                headers = {"Authorization": f"Bearer {self.token}"}
                payload = {
                    "data": query_text,
                    "topK": top_k,
                    "includeMetadata": True,
                    "namespace": namespace,
                }
                async with httpx.AsyncClient(timeout=5.0) as client:
                    resp = await client.post(f"{self.url}/query", json=payload, headers=headers)
                    if resp.status_code == 200:
                        data = resp.json()
                        return data.get("result", [])
            except Exception as exc:
                logger.warning("Upstash vector remote query failed, falling back to local: %s", exc)

        # Fallback local semantic keyword search over portfolio knowledge
        return self._local_fallback_search(query_text, top_k=top_k)

    def _local_fallback_search(self, query_text: str, top_k: int = 3) -> List[Dict[str, Any]]:
        from api.site_knowledge import build_site_knowledge, _tokenize
        chunks = build_site_knowledge()
        q_tokens = _tokenize(query_text)
        scored = []

        for idx, chunk in enumerate(chunks):
            c_tokens = _tokenize(chunk.text)
            overlap = len(q_tokens.intersection(c_tokens))
            if overlap > 0:
                score = round(overlap / (len(q_tokens) + 1), 3)
                scored.append({
                    "id": f"chunk-{idx}",
                    "score": score,
                    "metadata": {
                        "source": chunk.source,
                        "title": chunk.title,
                        "url": chunk.url,
                        "snippet": chunk.text[:300],
                    }
                })

        scored.sort(key=lambda x: x["score"], reverse=True)
        return scored[:top_k]


vector_service = UpstashVectorService()

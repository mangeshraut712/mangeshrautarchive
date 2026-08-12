"""
FastAPI route for Upstash Context7 Vector Similarity Search.
Exposes POST /api/vector-search endpoint for semantic RAG retrieval.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from api.integrations.upstash_vector import vector_service

router = APIRouter(prefix="/api", tags=["vector"])


class VectorQueryRequest(BaseModel):
    query: str
    top_k: Optional[int] = 3
    namespace: Optional[str] = "portfolio"


class VectorQueryResponse(BaseModel):
    query: str
    results: List[Dict[str, Any]]
    source: str


@router.post("/vector-search", response_model=VectorQueryResponse)
async def search_vector_similarity(req: VectorQueryRequest):
    if not req.query or not req.query.strip():
        raise HTTPException(status_code=400, detail="Query parameter cannot be empty.")

    results = await vector_service.query_similarity(
        query_text=req.query, top_k=req.top_k or 3, namespace=req.namespace or "portfolio"
    )
    source = "upstash_remote" if vector_service.is_configured else "local_semantic_fallback"

    return VectorQueryResponse(query=req.query, results=results, source=source)

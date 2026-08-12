"""
FastAPI route for Firecrawl URL Ingestion.
Exposes POST /api/ingest-url endpoint for Markdown scraping & site knowledge indexing.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional
from api.integrations.firecrawl_ingest import firecrawl_service

router = APIRouter(prefix="/api", tags=["ingest"])


class IngestUrlRequest(BaseModel):
    url: str


class IngestUrlResponse(BaseModel):
    success: bool
    url: str
    markdown: str
    source: str
    error: Optional[str] = None


@router.post("/ingest-url", response_model=IngestUrlResponse)
async def ingest_url_to_markdown(req: IngestUrlRequest):
    if not req.url or not req.url.strip():
        raise HTTPException(status_code=400, detail="URL parameter cannot be empty.")

    res = await firecrawl_service.scrape_url(req.url.strip())
    if not res.get("success"):
        raise HTTPException(
            status_code=422, detail=res.get("error", "Failed to ingest URL.")
        )

    return IngestUrlResponse(
        success=True,
        url=res["url"],
        markdown=res.get("markdown", ""),
        source=res.get("source", "unknown"),
    )

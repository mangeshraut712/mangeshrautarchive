import base64
import os
import re
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.responses import FileResponse
from pathlib import Path

import httpx
import logging

logger = logging.getLogger(__name__)

from api.config import (
    ContactMessage,
    NewsletterSubscribe,
    RATE_LIMIT_WINDOW,
    api_error,
    check_rate_limit,
    get_client_ip,
)

router = APIRouter()


@router.get("/api")
async def api_root():
    return {
        "message": "Mangesh Raut Portfolio API v3.0",
        "endpoints": {
            "chat": "/api/chat",
            "contact": "/api/contact",
            "newsletter_subscribe": "/api/newsletter/subscribe",
            "resume": "/api/resume",
            "health": "/api/health",
            "chat_health": "/api/chat/health",
            "github_repos": "/api/github/repos/public",
            "integrations_status": "/api/integrations/status",
            "health_vitals_summary": "/api/health-vitals/summary",
            "health_vitals_sync": "/api/health-vitals/sync",
            "integrations_sync_all": "/api/integrations/sync-all",
            "calendar_availability": "/api/calendar/availability",
            "google_calendar_connect": "/api/integrations/google-calendar/connect",
            "google_calendar_callback": "/api/calendar/callback/google",
            "microsoft_calendar_connect": "/api/integrations/microsoft-calendar/connect",
            "microsoft_calendar_callback": "/api/calendar/callback/microsoft",
            "apple_calendar_connect": "/api/integrations/apple-calendar/connect",
            "apple_calendar_callback": "/api/calendar/callback/apple",
            "google_calendar_watch": "/api/calendar/watch/google",
            "google_calendar_webhook": "/api/calendar/webhook/google",
            "whoop_connect": "/api/integrations/whoop/connect",
            "whoop_callback": "/api/integrations/whoop/callback",
            "withings_connect": "/api/integrations/withings/connect",
            "withings_callback": "/api/integrations/withings/callback",
            "integration_disconnect": "/api/integrations/{provider}/disconnect",
            "posters_movie": "/api/posters/movie",
            "posters_book": "/api/posters/book",
            "posters_batch": "/api/posters/batch",
            "docs": "/api/docs",
        },
    }


@router.post("/api/contact")
async def send_contact_message(payload: ContactMessage, req: Request):
    """Save contact form submission to Firestore via REST API."""
    client_ip = get_client_ip(req)
    if not check_rate_limit(f"contact:{client_ip}"):
        raise api_error(
            code="RATE_LIMITED",
            message="Too many contact submissions. Please wait before trying again.",
            status=429,
            retry_after=RATE_LIMIT_WINDOW,
        )

    email_re = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
    if not email_re.match(payload.email):
        raise HTTPException(status_code=400, detail="Invalid email address")

    firebase_api_key = os.getenv("GEMINI_FIREBASE_API_KEY") or os.getenv(
        "FIREBASE_API_KEY"
    )
    if not firebase_api_key:
        raise HTTPException(
            status_code=503,
            detail="Contact service not configured. Please email mbr63@drexel.edu directly.",
        )

    project_id = "mangeshrautarchive"
    url = (
        f"https://firestore.googleapis.com/v1/projects/{project_id}"
        f"/databases/(default)/documents/messages?key={firebase_api_key}"
    )

    doc_fields = {
        "fields": {
            "name": {"stringValue": payload.name.strip()},
            "email": {"stringValue": payload.email.strip()},
            "subject": {"stringValue": payload.subject.strip()},
            "message": {"stringValue": payload.message.strip()},
            "timestamp": {
                "timestampValue": datetime.now(timezone.utc)
                .isoformat()
                .replace("+00:00", "Z")
            },
            "userAgent": {"stringValue": req.headers.get("user-agent", "Unknown")},
            "submittedFrom": {
                "stringValue": req.headers.get("referer")
                or req.headers.get("origin")
                or "Direct"
            },
        }
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, json=doc_fields)

        if not resp.is_success:
            error_body = resp.text
            logger.error(f"❌ Firestore error {resp.status_code}: {error_body}")
            raise HTTPException(
                status_code=502,
                detail="Failed to save message. Please try again or email mbr63@drexel.edu.",
            )

        doc_id = resp.json().get("name", "").split("/")[-1]
        logger.info(f"✅ Contact message saved: {doc_id}")
        return {
            "success": True,
            "persisted": True,
            "message": "Message saved successfully!",
            "id": doc_id,
        }

    except httpx.RequestError as exc:
        logger.error(f"❌ Network error saving contact: {exc}", exc_info=True)
        raise HTTPException(status_code=503, detail="Network error. Please try again.")


def _newsletter_doc_id(email: str) -> str:
    normalized = email.strip().lower()
    return base64.urlsafe_b64encode(normalized.encode("utf-8")).decode("ascii").rstrip("=")


@router.post("/api/newsletter/subscribe")
async def subscribe_newsletter(payload: NewsletterSubscribe, req: Request):
    """Save dev newsletter subscription to Firestore."""
    client_ip = get_client_ip(req)
    if not check_rate_limit(f"newsletter:{client_ip}"):
        raise api_error(
            code="RATE_LIMITED",
            message="Too many subscription attempts. Please wait before trying again.",
            status=429,
            retry_after=RATE_LIMIT_WINDOW,
        )

    email_re = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
    email = payload.email.strip().lower()
    if not email_re.match(email):
        raise HTTPException(status_code=400, detail="Invalid email address")

    firebase_api_key = os.getenv("GEMINI_FIREBASE_API_KEY") or os.getenv(
        "FIREBASE_API_KEY"
    )
    if not firebase_api_key:
        raise HTTPException(
            status_code=503,
            detail="Newsletter service not configured. Please email mbr63@drexel.edu to subscribe.",
        )

    project_id = "mangeshrautarchive"
    doc_id = _newsletter_doc_id(email)
    url = (
        f"https://firestore.googleapis.com/v1/projects/{project_id}"
        f"/databases/(default)/documents/newsletter_subscribers"
        f"?documentId={doc_id}&key={firebase_api_key}"
    )

    doc_fields = {
        "fields": {
            "email": {"stringValue": email},
            "subscribedAt": {
                "timestampValue": datetime.now(timezone.utc)
                .isoformat()
                .replace("+00:00", "Z")
            },
            "source": {"stringValue": "blog_newsletter"},
            "userAgent": {"stringValue": req.headers.get("user-agent", "Unknown")},
            "submittedFrom": {
                "stringValue": req.headers.get("referer")
                or req.headers.get("origin")
                or "Direct"
            },
        }
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, json=doc_fields)

        if resp.status_code == 409:
            return {
                "success": True,
                "persisted": True,
                "message": "You are already subscribed. Thanks for reading!",
                "alreadySubscribed": True,
                "id": doc_id,
            }

        if not resp.is_success:
            error_body = resp.text
            logger.error(f"❌ Newsletter Firestore error {resp.status_code}: {error_body}")
            raise HTTPException(
                status_code=502,
                detail="Subscription failed. Please try again in a moment.",
            )

        doc_name = resp.json().get("name", "").split("/")[-1]
        logger.info(f"✅ Newsletter subscriber saved: {doc_name}")
        return {
            "success": True,
            "persisted": True,
            "message": "Thanks for subscribing! Watch your inbox for the next issue.",
            "id": doc_name,
        }

    except httpx.RequestError as exc:
        logger.error(f"❌ Network error saving newsletter subscription: {exc}", exc_info=True)
        raise HTTPException(status_code=503, detail="Network error. Please try again.")


@router.get("/api/health", tags=["core"], summary="General health check")
async def health_check():
    from api.config import get_default_model, get_openrouter_api_key

    api_key = get_openrouter_api_key()
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "success": True,
        "ai": {
            "configured": bool(api_key),
            "provider": "openrouter" if api_key else "local",
            "model": get_default_model(),
            "streaming": "ndjson",
            "health_path": "/api/chat/health",
        },
    }


@router.get("/api/status", tags=["core"], summary="General status check")
async def status_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "success": True
    }


RESUME_EDITIONS = {
    "usa": {
        "id": "usa",
        "title": "USA / International Resume",
        "file": "001_Mangesh_Resume_USA.pdf",
        "download_name": "Mangesh_Raut_Resume_USA.pdf",
        "static_url": "/assets/files/001_Mangesh_Resume_USA.pdf",
        "region": "USA & Global",
    },
    "india": {
        "id": "india",
        "title": "India / Pune Resume",
        "file": "001_Mangesh_Resume_Pune.pdf",
        "download_name": "Mangesh_Raut_Resume_Pune.pdf",
        "static_url": "/assets/files/001_Mangesh_Resume_Pune.pdf",
        "region": "India & Asia",
    },
    "primary": {
        "id": "primary",
        "title": "Primary Resume",
        "file": "Mangesh_Raut_Resume.pdf",
        "download_name": "Mangesh_Raut_Resume.pdf",
        "static_url": "/assets/files/Mangesh_Raut_Resume.pdf",
        "region": "Global",
    },
}


def _resolve_resume_file_path(filename: str) -> Path | None:
    """Find resume PDF in dist/assets/files or src/assets/files."""
    project_root = Path(__file__).resolve().parent.parent.parent
    candidates = [
        project_root / "dist" / "assets" / "files" / filename,
        project_root / "src" / "assets" / "files" / filename,
    ]
    for p in candidates:
        if p.is_file():
            return p
    return None


@router.get("/api/resume", tags=["resume"], summary="List available resume editions")
async def get_resume_info():
    """Returns metadata for all available resume versions."""
    resumes = {}
    for key, info in RESUME_EDITIONS.items():
        file_path = _resolve_resume_file_path(info["file"])
        resumes[key] = {
            **info,
            "available": file_path is not None,
            "size_bytes": file_path.stat().st_size if file_path else 0,
            "download_api": f"/api/resume/download?region={key}",
        }

    return {
        "success": True,
        "default": "usa",
        "editions": resumes,
        "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
    }


@router.get("/api/resume/download", tags=["resume"], summary="Download a specific resume PDF edition")
async def download_resume(region: str = Query(default="usa", description="Resume edition: usa, india, or primary")):
    """Streams requested resume PDF with Content-Disposition attachment header."""
    edition_key = (region or "usa").strip().lower()
    if edition_key not in RESUME_EDITIONS:
        edition_key = "usa"

    info = RESUME_EDITIONS[edition_key]
    file_path = _resolve_resume_file_path(info["file"])

    if not file_path:
        raise HTTPException(
            status_code=404,
            detail=f"Resume file '{info['file']}' not found on server",
        )

    headers = {
        "Content-Disposition": f'attachment; filename="{info["download_name"]}"',
        "Content-Type": "application/pdf",
        "Cache-Control": "public, max-age=0, must-revalidate",
        "X-Content-Type-Options": "nosniff",
    }

    logger.info(f"📄 Resume download served: {info['id']} ({info['download_name']})")
    return FileResponse(
        path=file_path,
        media_type="application/pdf",
        filename=info["download_name"],
        headers=headers,
    )

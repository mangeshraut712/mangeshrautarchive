import base64
import os
import re
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Request

import httpx

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
            "github_repos": "/api/github/repos/public",
            "integrations_status": "/api/integrations/status",
            "health_vitals_summary": "/api/health-vitals/summary",
            "calendar_availability": "/api/calendar/availability",
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

    # Basic email validation
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
            print(f"❌ Firestore error {resp.status_code}: {error_body}")
            raise HTTPException(
                status_code=502,
                detail="Failed to save message. Please try again or email mbr63@drexel.edu.",
            )

        doc_id = resp.json().get("name", "").split("/")[-1]
        print(f"✅ Contact message saved: {doc_id}")
        return {"success": True, "message": "Message sent successfully!", "id": doc_id}

    except httpx.RequestError as exc:
        print(f"❌ Network error saving contact: {exc}")
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
                "message": "You are already subscribed. Thanks for reading!",
                "alreadySubscribed": True,
            }

        if not resp.is_success:
            error_body = resp.text
            print(f"❌ Newsletter Firestore error {resp.status_code}: {error_body}")
            raise HTTPException(
                status_code=502,
                detail="Subscription failed. Please try again in a moment.",
            )

        doc_name = resp.json().get("name", "").split("/")[-1]
        print(f"✅ Newsletter subscriber saved: {doc_name}")
        return {
            "success": True,
            "message": "Thanks for subscribing! Watch your inbox for the next issue.",
            "id": doc_name,
        }

    except httpx.RequestError as exc:
        print(f"❌ Network error saving newsletter subscription: {exc}")
        raise HTTPException(status_code=503, detail="Network error. Please try again.")


@router.get("/api/health", tags=["core"], summary="General health check")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "success": True
    }


@router.get("/api/status", tags=["core"], summary="General status check")
async def status_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "success": True
    }

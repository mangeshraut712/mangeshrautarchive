import os
import re
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Request

import httpx

from api.config import ContactMessage

router = APIRouter()


@router.get("/api")
async def api_root():
    return {
        "message": "Mangesh Raut Portfolio API v3.0",
        "endpoints": {
            "chat": "/api/chat",
            "contact": "/api/contact",
            "resume": "/api/resume",
            "health": "/api/health",
            "github_repos": "/api/github/repos/public",
            "posters_movie": "/api/posters/movie",
            "posters_book": "/api/posters/book",
            "posters_batch": "/api/posters/batch",
            "docs": "/api/docs",
        },
    }


@router.post("/api/contact")
async def send_contact_message(payload: ContactMessage, req: Request):
    """Save contact form submission to Firestore via REST API."""
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
        print(f"✅ Contact message saved: {doc_id} from {payload.email}")
        return {"success": True, "message": "Message sent successfully!", "id": doc_id}

    except httpx.RequestError as exc:
        print(f"❌ Network error saving contact: {exc}")
        raise HTTPException(status_code=503, detail="Network error. Please try again.")

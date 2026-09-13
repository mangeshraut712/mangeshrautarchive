import logging
from datetime import datetime, timezone
from typing import Dict, Any
from fastapi import APIRouter, HTTPException, Request

from pydantic import BaseModel, Field

from api.config import get_client_ip, check_rate_limit, verify_session_token
from api.memory_manager import memory_manager

logger = logging.getLogger(__name__)
router = APIRouter()


class UserPreferencesPayload(BaseModel):
    preferences: Dict[str, Any] = Field(default_factory=dict)


def _resolve_authenticated_user(request: Request) -> str:
    """Resolve user ID, requiring token verification when session ID is explicitly provided."""
    session_id = request.headers.get("x-session-id", "").strip() or request.query_params.get("session_id", "").strip()
    if session_id:
        token = request.headers.get("x-session-token", "").strip()
        if not verify_session_token(session_id, token):
            raise HTTPException(status_code=403, detail="Session token verification failed")
        return session_id[:128]
    return str(get_client_ip(request))[:128]


def _check_personalization_rate_limit(request: Request) -> None:
    client_ip = get_client_ip(request)
    if not check_rate_limit(f"personalization:{client_ip}"):
        raise HTTPException(status_code=429, detail="Too many personalization requests. Please wait.")


@router.get("/api/memory/stats")
async def get_memory_stats():
    """Get memory system statistics"""
    stats = memory_manager.get_stats()
    return {
        "success": True,
        "data": stats,
        "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
    }


@router.post("/api/personalization/preferences")
async def update_user_preferences(request: Request, payload: UserPreferencesPayload):
    """
    Update user preferences (GDPR compliant)
    """
    _check_personalization_rate_limit(request)
    try:
        user_id = _resolve_authenticated_user(request)
        prefs = payload.preferences

        memory_manager.update_preferences(user_id, prefs)

        return {
            "success": True,
            "message": "Preferences updated successfully",
            "user_id": user_id,
            "preferences": prefs,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Preference update error: %s", type(e).__name__, exc_info=True)
        raise HTTPException(status_code=500, detail="Error updating preferences")


@router.get("/api/personalization/export")
async def export_user_data(request: Request):
    """Export stored personalization and conversation data for the current client."""
    _check_personalization_rate_limit(request)
    resolved_user_id = _resolve_authenticated_user(request)
    payload = memory_manager.export_user_data(resolved_user_id)

    return {
        "success": True,
        "data": payload,
        "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
    }


@router.delete("/api/personalization/delete")
async def delete_user_data(request: Request):
    """Delete stored personalization and conversation data for the current client."""
    _check_personalization_rate_limit(request)
    resolved_user_id = _resolve_authenticated_user(request)
    result = memory_manager.delete_user_data(resolved_user_id)

    return {
        "success": True,
        "message": "User data deleted successfully",
        "user_id": resolved_user_id,
        "removed": result,
        "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
    }


@router.get("/api/personalization/greeting")
async def get_personalized_greeting(request: Request):
    """
    Get personalized greeting based on user history
    """
    user_id = _resolve_authenticated_user(request)

    greeting = memory_manager.get_personalized_greeting(user_id)
    context = memory_manager.get_context_for_user(user_id)

    return {
        "success": True,
        "greeting": greeting,
        "context": context,
        "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
    }

from datetime import datetime, timezone
from typing import Dict, Any
from fastapi import APIRouter, HTTPException, Request

from api.config import get_client_ip
from api.memory_manager import memory_manager

router = APIRouter()


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
async def update_user_preferences(request: Request, preferences: Dict[str, Any]):
    """
    Update user preferences (GDPR compliant)
    """
    try:
        user_id = str(get_client_ip(request))[:128]
        prefs = preferences.get("preferences", {})

        memory_manager.update_preferences(user_id, prefs)

        return {
            "success": True,
            "message": "Preferences updated successfully",
            "user_id": user_id,
            "preferences": prefs,
        }
    except Exception as e:
        print(f"Preference update error: {type(e).__name__}")
        raise HTTPException(status_code=500, detail="Error updating preferences")


@router.get("/api/personalization/export")
async def export_user_data(request: Request):
    """Export stored personalization and conversation data for the current client."""
    resolved_user_id = str(get_client_ip(request))[:128]
    payload = memory_manager.export_user_data(resolved_user_id)

    return {
        "success": True,
        "data": payload,
        "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
    }


@router.delete("/api/personalization/delete")
async def delete_user_data(request: Request):
    """Delete stored personalization and conversation data for the current client."""
    resolved_user_id = str(get_client_ip(request))[:128]
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
    user_id = get_client_ip(request)

    greeting = memory_manager.get_personalized_greeting(user_id)
    context = memory_manager.get_context_for_user(user_id)

    return {
        "success": True,
        "greeting": greeting,
        "context": context,
        "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
    }

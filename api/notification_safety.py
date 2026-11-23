"""External notifications fail closed without confirmation, allowlist, and durable quota."""
import hashlib
import os
import httpx


async def reserve_notification(channel, destination, confirmed):
    if not confirmed or os.getenv("PORTFOLIO_LOCAL_ONLY") == "1":
        return False
    if os.getenv("CONTACT_NOTIFICATIONS_ENABLED") != "true":
        return False
    identity = hashlib.sha256(f"{channel}:{destination}".encode()).hexdigest()
    if identity not in {item.strip() for item in os.getenv("CONTACT_NOTIFICATION_ALLOWLIST", "").split(",")}:
        return False
    try:
        limit = int(os.getenv("CONTACT_NOTIFICATION_DAILY_LIMIT", "0"))
    except ValueError:
        return False
    url = os.getenv("SUPABASE_URL", "").rstrip("/")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    if not 1 <= limit <= 100 or not url or not key:
        return False
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.post(
                f"{url}/rest/v1/rpc/reserve_contact_notification",
                headers={"apikey": key, "Authorization": f"Bearer {key}"},
                json={"recipient_hash": identity, "daily_limit": limit},
            )
        return response.is_success and response.json() is True
    except (httpx.HTTPError, ValueError):
        return False

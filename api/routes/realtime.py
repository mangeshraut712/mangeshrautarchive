import asyncio
import hashlib
import hmac
import json
import logging
import os
import secrets
import time
from datetime import datetime, timezone
from typing import Dict, Optional, Set
from urllib.parse import urlparse

import websockets
from fastapi import APIRouter, Request, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse

from api.ai_gateway_realtime import (
    build_gateway_realtime_protocols,
    build_gateway_realtime_url,
    build_realtime_session_config,
    build_realtime_session_instructions,
    get_ai_gateway_api_key,
    get_realtime_model,
    is_realtime_configured,
    mint_gateway_realtime_client_secret,
)

router = APIRouter()
logger = logging.getLogger(__name__)

REALTIME_MINT_TTL_SEC = int(os.getenv("REALTIME_MINT_TTL_SEC", "60"))
REALTIME_MAX_CONNECTIONS = int(os.getenv("REALTIME_MAX_CONNECTIONS", "8"))
REALTIME_IDLE_TIMEOUT_SEC = float(os.getenv("REALTIME_IDLE_TIMEOUT_SEC", "45"))

_ALLOWED_ORIGIN_HOSTS = {
    "mangeshraut.pro",
    "mangeshraut712.github.io",
    "mraut.vercel.app",
    "mangeshrautarchive.vercel.app",
    "localhost",
    "127.0.0.1",
}

# Best-effort single-use tracking (per isolate). HMAC expiry is the cross-runtime guarantee.
_mint_nonces: Dict[str, float] = {}
_consumed_nonces: Dict[str, float] = {}
_active_connections: Set[int] = set()


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _mint_secret() -> bytes:
    secret = (
        os.getenv("REALTIME_MINT_SECRET", "").strip()
        or os.getenv("AI_GATEWAY_API_KEY", "").strip()
        or os.getenv("VERCEL_AI_GATEWAY_API_KEY", "").strip()
        or "dev-realtime-mint"
    )
    return secret.encode("utf-8")


def _sign_mint(exp: int, nonce: str) -> str:
    message = f"{exp}.{nonce}".encode("utf-8")
    return hmac.new(_mint_secret(), message, hashlib.sha256).hexdigest()[:32]


def _resolve_public_ws_url(request: Request, mint_token: str) -> str:
    forwarded_proto = request.headers.get("x-forwarded-proto", request.url.scheme)
    host = request.headers.get("x-forwarded-host") or request.headers.get("host") or request.url.netloc
    scheme = "wss" if forwarded_proto == "https" else "ws"
    return f"{scheme}://{host}/api/realtime/ws?token={mint_token}"


def _origin_allowed(origin: Optional[str]) -> bool:
    if not origin:
        # Browsers send Origin for cross-site WS; missing Origin is only OK outside production.
        return os.getenv("VERCEL_ENV") != "production"
    try:
        parsed = urlparse(origin)
    except ValueError:
        return False
    host = (parsed.hostname or "").lower()
    if host in _ALLOWED_ORIGIN_HOSTS:
        return True
    return host.endswith(".vercel.app") and "mangeshraut" in host


def _purge_expired_mints(now: Optional[float] = None) -> None:
    current = now if now is not None else time.time()
    for store in (_mint_nonces, _consumed_nonces):
        expired = [nonce for nonce, expires_at in store.items() if expires_at <= current]
        for nonce in expired:
            store.pop(nonce, None)


def _issue_mint_token() -> str:
    """Issue an HMAC mint that Node realtime-ws.js can verify without shared memory."""
    _purge_expired_mints()
    exp = int(time.time()) + REALTIME_MINT_TTL_SEC
    nonce = secrets.token_urlsafe(16)
    sig = _sign_mint(exp, nonce)
    _mint_nonces[nonce] = float(exp)
    return f"{exp}.{nonce}.{sig}"


def _consume_mint_token(token: Optional[str]) -> bool:
    if not token or token.count(".") != 2:
        return False
    exp_s, nonce, sig = token.split(".", 2)
    try:
        exp = int(exp_s)
    except ValueError:
        return False
    expected = _sign_mint(exp, nonce)
    if not hmac.compare_digest(sig, expected):
        return False
    now = time.time()
    if exp <= int(now):
        return False
    _purge_expired_mints(now)
    if nonce in _consumed_nonces:
        return False
    _consumed_nonces[nonce] = float(exp)
    _mint_nonces.pop(nonce, None)
    return True


@router.get("/api/realtime/health")
async def realtime_health():
    return {
        "success": True,
        "timestamp": _utc_now(),
        "available": is_realtime_configured(),
        "model": get_realtime_model(),
        "provider": "vercel-ai-gateway",
        "mode": "server-proxied-websocket",
    }


@router.get("/api/realtime/session")
async def realtime_session(request: Request):
    if not is_realtime_configured():
        return JSONResponse(
            status_code=503,
            content={
                "success": False,
                "available": False,
                "message": "AI Gateway realtime is not configured.",
            },
        )

    origin = request.headers.get("origin")
    if not _origin_allowed(origin):
        return JSONResponse(
            status_code=403,
            content={
                "success": False,
                "available": False,
                "message": "Origin not allowed for realtime sessions.",
            },
        )

    if len(_active_connections) >= REALTIME_MAX_CONNECTIONS:
        return JSONResponse(
            status_code=429,
            content={
                "success": False,
                "available": False,
                "message": "Realtime connection capacity reached. Try again shortly.",
            },
        )

    mint_token = _issue_mint_token()
    return {
        "success": True,
        "timestamp": _utc_now(),
        "available": True,
        "model": get_realtime_model(),
        "wsUrl": _resolve_public_ws_url(request, mint_token),
        "mintExpiresIn": REALTIME_MINT_TTL_SEC,
        "sessionDefaults": {
            "voice": os.getenv("AI_GATEWAY_REALTIME_VOICE", "alloy"),
            "turnDetection": {"type": "server-vad"},
            "inputAudioTranscription": {},
            "instructions": build_realtime_session_instructions(),
        },
    }


@router.websocket("/api/realtime/ws")
async def realtime_voice_proxy(client_ws: WebSocket):
    origin = client_ws.headers.get("origin")
    token = client_ws.query_params.get("token")

    if not _origin_allowed(origin) or not _consume_mint_token(token):
        await client_ws.accept()
        await client_ws.close(code=1008, reason="Unauthorized realtime session")
        return

    if len(_active_connections) >= REALTIME_MAX_CONNECTIONS:
        await client_ws.accept()
        await client_ws.close(code=1013, reason="Realtime capacity reached")
        return

    await client_ws.accept()
    connection_id = id(client_ws)
    _active_connections.add(connection_id)

    api_key = get_ai_gateway_api_key()
    if not api_key:
        _active_connections.discard(connection_id)
        await client_ws.close(code=1013, reason="Realtime unavailable")
        return

    try:
        client_secret = await mint_gateway_realtime_client_secret(
            session=build_realtime_session_config(),
        )
        upstream_url = build_gateway_realtime_url()
        protocols = build_gateway_realtime_protocols(client_secret)
    except Exception as error:
        logger.warning("Realtime client secret mint failed: %s", error)
        _active_connections.discard(connection_id)
        await client_ws.close(code=1013, reason="Realtime unavailable")
        return

    try:
        async with websockets.connect(
            upstream_url,
            subprotocols=list(protocols),  # type: ignore[arg-type]
            ping_interval=20,
            ping_timeout=20,
            max_size=8 * 1024 * 1024,
        ) as upstream:

            async def client_to_upstream() -> None:
                try:
                    while True:
                        message = await asyncio.wait_for(
                            client_ws.receive(),
                            timeout=REALTIME_IDLE_TIMEOUT_SEC,
                        )
                        if message["type"] == "websocket.disconnect":
                            break
                        data = message.get("text")
                        if data is None:
                            continue
                        try:
                            payload = json.loads(data)
                            events = payload if isinstance(payload, list) else [payload]
                            if any(
                                isinstance(event, dict) and event.get("type") == "session-update"
                                for event in events
                            ):
                                continue
                        except json.JSONDecodeError:
                            pass
                        await upstream.send(data)
                except (WebSocketDisconnect, asyncio.TimeoutError):
                    pass

            async def upstream_to_client() -> None:
                async for message in upstream:
                    text = (
                        message
                        if isinstance(message, str)
                        else message.decode("utf-8", errors="replace")
                    )
                    await client_ws.send_text(text)

            done, pending = await asyncio.wait(
                [
                    asyncio.create_task(client_to_upstream()),
                    asyncio.create_task(upstream_to_client()),
                ],
                return_when=asyncio.FIRST_COMPLETED,
            )
            for task in pending:
                task.cancel()
            await asyncio.gather(*done, return_exceptions=True)

    except Exception as error:
        logger.warning("Realtime gateway proxy failed: %s", error)
        try:
            await client_ws.close(code=1011, reason="Realtime proxy error")
        except Exception:
            pass
    finally:
        _active_connections.discard(connection_id)

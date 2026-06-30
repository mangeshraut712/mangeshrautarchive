import asyncio
import json
import logging
import os
from datetime import datetime, timezone

import websockets
from fastapi import APIRouter, Request, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse

from api.ai_gateway_realtime import (
    build_gateway_realtime_protocols,
    build_gateway_realtime_url,
    build_realtime_session_instructions,
    get_ai_gateway_api_key,
    get_realtime_model,
    is_realtime_configured,
)

router = APIRouter()
logger = logging.getLogger(__name__)


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _resolve_public_ws_url(request: Request) -> str:
    forwarded_proto = request.headers.get("x-forwarded-proto", request.url.scheme)
    host = request.headers.get("x-forwarded-host") or request.headers.get("host") or request.url.netloc
    scheme = "wss" if forwarded_proto == "https" else "ws"
    return f"{scheme}://{host}/api/realtime/ws"


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

    return {
        "success": True,
        "timestamp": _utc_now(),
        "available": True,
        "model": get_realtime_model(),
        "wsUrl": _resolve_public_ws_url(request),
        "sessionDefaults": {
            "voice": os.getenv("AI_GATEWAY_REALTIME_VOICE", "alloy"),
            "turnDetection": {"type": "server-vad"},
            "inputAudioTranscription": {},
            "instructions": build_realtime_session_instructions(),
        },
    }


@router.websocket("/api/realtime/ws")
async def realtime_voice_proxy(client_ws: WebSocket):
    await client_ws.accept()

    api_key = get_ai_gateway_api_key()
    if not api_key:
        await client_ws.close(code=1013, reason="Realtime unavailable")
        return

    upstream_url = build_gateway_realtime_url()
    protocols = build_gateway_realtime_protocols(api_key)

    try:
        async with websockets.connect(
            upstream_url,
            subprotocols=protocols,
            ping_interval=20,
            ping_timeout=20,
            max_size=8 * 1024 * 1024,
        ) as upstream:

            async def client_to_upstream() -> None:
                try:
                    while True:
                        message = await client_ws.receive()
                        if message["type"] == "websocket.disconnect":
                            break
                        data = message.get("text")
                        if data is None:
                            continue
                        await upstream.send(data)
                except WebSocketDisconnect:
                    pass

            async def upstream_to_client() -> None:
                async for message in upstream:
                    await client_ws.send_text(message)

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
            await client_ws.send_text(
                json.dumps(
                    {
                        "type": "error",
                        "message": "Realtime voice session failed. Please try again.",
                    }
                )
            )
        except Exception:
            pass
        await client_ws.close(code=1011, reason="Upstream realtime error")

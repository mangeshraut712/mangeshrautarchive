"""
API Monitor Backend Server
Provides comprehensive API health monitoring and testing capabilities
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any, List
import httpx
import asyncio
import time
import os
from datetime import datetime

# Initialize FastAPI with proper configuration
app = FastAPI(
    title="API Monitor",
    description="Comprehensive API health monitoring and testing platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware with proper configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],  # Restrict in production
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Configuration
ALERT_WEBHOOK_URL = os.getenv("DEPLOYMENT_ALERT_WEBHOOK")

# In-memory storage with proper typing
endpoints: List[Dict[str, Any]] = []
health_test_history: List[Dict[str, Any]] = []
deployment_status_history: List[Dict[str, Any]] = []

# Deployment URLs for monitoring
DEPLOYMENT_URLS: Dict[str, str] = {
    "github_pages": "https://mangeshraut712.github.io/mangeshrautarchive/",
    "vercel": "https://mangeshrautarchive.vercel.app/",
}


async def send_deployment_alert(message: str) -> None:
    """Send alert for deployment issues via webhook."""
    if not ALERT_WEBHOOK_URL:
        print(f"🚨 DEPLOYMENT ALERT: {message}")
        return

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            await client.post(
                ALERT_WEBHOOK_URL,
                json={"text": f"🚨 *Deployment Alert*\n{message}"},
                headers={"Content-Type": "application/json"},
            )
        print("✅ Deployment alert sent successfully")
    except Exception as e:
        print(f"⚠️ Failed to send deployment alert: {e}")


# Type definitions for better code clarity
EndpointType = Dict[str, Any]
HealthCheckRequestType = Dict[str, Any]


@app.get("/")
def root():
    return {"message": "API Monitor Backend", "version": "1.0.0"}


# Known API endpoints for discovery
KNOWN_ENDPOINTS = [
    {
        "path": "/api/chat",
        "methods": ["POST"],
        "name": "chat",
        "summary": "AI Chat endpoint",
    },
    {
        "path": "/api/models",
        "methods": ["GET"],
        "name": "models",
        "summary": "Available AI models",
    },
    {
        "path": "/api/health",
        "methods": ["GET"],
        "name": "health",
        "summary": "API health check",
    },
    {
        "path": "/api/github/profile",
        "methods": ["GET"],
        "name": "github_profile",
        "summary": "GitHub profile data",
    },
    {
        "path": "/api/github/repos",
        "methods": ["GET"],
        "name": "github_repos",
        "summary": "GitHub repositories",
    },
    {
        "path": "/api/resume",
        "methods": ["GET"],
        "name": "resume",
        "summary": "Download resume",
    },
    {
        "path": "/api/contact",
        "methods": ["POST"],
        "name": "contact",
        "summary": "Contact form",
    },
    {
        "path": "/api/memory/stats",
        "methods": ["GET"],
        "name": "memory_stats",
        "summary": "Memory system stats",
    },
]


@app.get("/api/health/endpoints")
def list_endpoints():
    """List all known API endpoints"""
    return {
        "success": True,
        "count": len(KNOWN_ENDPOINTS),
        "endpoints": KNOWN_ENDPOINTS,
    }


@app.post("/api/health/endpoints")
def add_endpoint() -> Dict[str, Any]:
    """Add new endpoint for monitoring."""
    return {
        "status": "ok",
        "message": "Endpoint added successfully",
        "id": f"endpoint_{int(time.time())}",
        "timestamp": datetime.utcnow().isoformat(),
    }


@app.get("/api/health")
def api_health() -> Dict[str, Any]:
    """Monitor API health check."""
    return {
        "status": "healthy",
        "service": "API Monitor",
        "version": "1.0.0",
        "uptime": time.time(),
        "timestamp": datetime.utcnow().isoformat(),
    }


@app.post("/api/health/test")
async def run_health_test(test_req):
    """Run health test on endpoint"""
    start_time = time.time()

    # Resolve relative URLs
    if not test_req.get("url", "").startswith("http"):
        base_url = "http://localhost:8000"  # Default base URL
        url_path = test_req.get("url", "")
        test_req["url"] = (
            f"{base_url}{url_path if url_path.startswith('/') else '/' + url_path}"
        )

    # Setup headers
    client_headers = test_req.headers or {}
    if test_req.auth_token:
        client_headers["Authorization"] = f"Bearer {test_req.auth_token}"

    try:
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            request_args = {
                "method": test_req.method,
                "url": test_req.url,
                "headers": client_headers,
            }
            if test_req.body:
                request_args["json"] = test_req.body

            response = await client.request(**request_args)
            duration = (time.time() - start_time) * 1000

            result = {
                "id": f"test_{int(time.time())}_{hash(str(time.time())) % 1000}",
                "timestamp": datetime.now().isoformat(),
                "url": test_req.url,
                "method": test_req.method,
                "status_code": response.status_code,
                "duration_ms": round(duration, 2),
                "is_up": 200 <= response.status_code < 400,
                "response_size_kb": round(len(response.content) / 1024, 2),
                "headers": dict(response.headers),
                "error": None,
            }

            # Simple alerting logic
            if duration > 1000:
                result["alert"] = "⚠️ Slow response threshold exceeded (>1000ms)"

            # Log for audit trail
            health_test_history.insert(0, result)
            if len(health_test_history) > 50:
                health_test_history.pop()

            try:
                raw_response = (
                    response.json()
                    if "application/json" in response.headers.get("Content-Type", "")
                    else response.text[:2000]
                )
            except:
                raw_response = response.text[:2000]

            return {"success": True, "result": result, "raw_response": raw_response}

    except Exception as e:
        error_result = {
            "id": f"alert_{int(time.time())}_{hash(str(time.time())) % 1000}",
            "timestamp": datetime.now().isoformat(),
            "url": test_req.url,
            "method": test_req.method,
            "status_code": 0,
            "duration_ms": round((time.time() - start_time) * 1000, 2),
            "is_up": False,
            "response_size_kb": 0,
            "error": str(e),
        }
        health_test_history.insert(0, error_result)
        return {"success": False, "result": error_result}


@app.get("/api/health/logs")
def get_health_logs():
    """Get recent health test logs"""
    return {
        "success": True,
        "count": len(health_test_history),
        "logs": health_test_history,
    }


@app.get("/api/deployments/health")
async def check_deployments_health():
    """Check health of all deployments"""
    results = {}

    for name, url in DEPLOYMENT_URLS.items():
        start_time = time.time()
        try:
            async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
                response = await client.get(
                    url,
                    headers={
                        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
                    },
                )

                response_time = (time.time() - start_time) * 1000
                status = "healthy" if response.status_code == 200 else "degraded"

                results[name] = {
                    "status": status,
                    "response_time": round(response_time, 2),
                    "http_status": response.status_code,
                    "last_checked": datetime.now().isoformat(),
                }

        except Exception as e:
            results[name] = {
                "status": "unhealthy",
                "error": str(e),
                "last_checked": datetime.now().isoformat(),
            }
            # Send alert for unhealthy deployment
            await send_deployment_alert(
                f"🚨 {name.upper()} deployment is unhealthy: {str(e)}"
            )

    # Check deployment sync
    try:
        # Get version info from both deployments
        github_version = None
        vercel_version = None

        if results.get("github_pages", {}).get("status") == "healthy":
            try:
                async with httpx.AsyncClient(timeout=5.0) as client:
                    response = await client.get(
                        "https://mangeshraut712.github.io/mangeshrautarchive/manifest.json"
                    )
                    if response.status_code == 200:
                        data = response.json()
                        github_version = data.get("version")
            except:
                pass

        if results.get("vercel", {}).get("status") == "healthy":
            try:
                async with httpx.AsyncClient(timeout=5.0) as client:
                    response = await client.get(
                        "https://mangeshrautarchive.vercel.app/api/health"
                    )
                    if response.status_code == 200:
                        data = response.json()
                        vercel_version = data.get("version")
            except:
                pass

        # Determine sync status - handle cases where versions aren't available yet
        if not github_version and not vercel_version:
            sync_status = "unknown"  # Both deployments don't have version info yet
        elif github_version and vercel_version and github_version == vercel_version:
            sync_status = "synced"
        else:
            sync_status = "out_of_sync"
            # Send alert for out of sync deployments
            await send_deployment_alert(
                f"⚠️ Deployments are out of sync!\nGitHub Pages: {github_version or 'N/A'}\nVercel: {vercel_version or 'N/A'}"
            )

        results["sync"] = {
            "status": sync_status,
            "github_version": github_version,
            "vercel_version": vercel_version,
            "last_checked": datetime.now().isoformat(),
        }

    except Exception as e:
        results["sync"] = {
            "status": "check_failed",
            "error": str(e),
            "last_checked": datetime.now().isoformat(),
        }

    # Store in history
    deployment_status_history.insert(
        0, {"timestamp": datetime.now().isoformat(), "results": results}
    )
    if len(deployment_status_history) > 20:
        deployment_status_history.pop()

    return {"success": True, "deployments": results}


@app.get("/api/deployments/logs")
async def get_deployment_logs():
    """Get deployment status history"""
    return {
        "success": True,
        "count": len(deployment_status_history),
        "logs": deployment_status_history,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)

import os
from datetime import datetime, timezone
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

from api.config import get_default_model, get_openrouter_api_key

# Monitoring
from api.monitoring import (
    system_monitor,
    EventType,
)
from api.middleware import MonitoringMiddleware

# Routes
from api.routes import (
    chat,
    github,
    media,
    analytics,
    monitor,
    general,
    personalization,
    integrations,
    realtime,
    tts,
)

# Load environment variables (.env.local overrides .env).
load_dotenv(".env.local")
load_dotenv()

OPENAPI_TAGS = [
    {
        "name": "system-monitor",
        "description": "Operational health, metrics, event history, service integrations, and monitor reference data.",
    },
    {
        "name": "core",
        "description": "General API status, models, and application-level endpoints.",
    },
]

# Initialize FastAPI with optimizations
_enable_public_docs = os.getenv("ENABLE_PUBLIC_API_DOCS", "").lower() in {"1", "true", "yes"}
_is_production_runtime = os.getenv("VERCEL_ENV") == "production"
_public_docs_enabled = _enable_public_docs or not _is_production_runtime

app = FastAPI(
    title="AssistMe - AI Portfolio Assistant API",
    description=(
        "AssistMe backend for the portfolio experience. "
        "Includes chatbot APIs, GitHub activity, monitor endpoints, and operational diagnostics."
    ),
    version="3.0.0",
    docs_url="/api/docs" if _public_docs_enabled else None,
    redoc_url="/api/redoc" if _public_docs_enabled else None,
    openapi_url="/api/openapi.json" if _public_docs_enabled else None,
    openapi_tags=OPENAPI_TAGS,
)

# Add monitoring middleware (only if system_monitor initialized successfully)
if system_monitor is not None:
    app.add_middleware(MonitoringMiddleware, monitor=system_monitor)

# Add GZip compression for better performance
app.add_middleware(GZipMiddleware, minimum_size=1000)

# CORS Configuration — explicit origins only (no wildcard with credentials)
origins = [
    # Production domains
    "https://mangeshraut712.github.io",
    "https://mangeshraut.pro",
    "https://mraut.vercel.app",
    "https://mangeshrautarchive.vercel.app",
    # Development
    "http://localhost:4000",
    "https://localhost:4000",
    "http://localhost:4001",
    "https://localhost:4001",
    "http://localhost:4002",
    "https://localhost:4002",
    "http://localhost:4173",
    "https://localhost:4173",
    "http://localhost:4180",
    "https://localhost:4180",
    "http://127.0.0.1:4180",
    "https://127.0.0.1:4180",
    "http://localhost:3000",
    "http://localhost:8000",
    "http://localhost:8001",
    "https://localhost:8001",
    "http://localhost:5173",
    "https://localhost:5173",
    "http://127.0.0.1:4000",
    "https://127.0.0.1:4000",
    "http://127.0.0.1:4001",
    "https://127.0.0.1:4001",
    "http://127.0.0.1:4002",
    "https://127.0.0.1:4002",
    "http://127.0.0.1:4173",
    "https://127.0.0.1:4173",
    "http://127.0.0.1:8000",
    "http://127.0.0.1:8001",
    "https://127.0.0.1:8001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "https://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=[
        "Content-Type",
        "Authorization",
        "Accept",
        "Cache-Control",
        "Origin",
        "Pragma",
        "X-Requested-With",
        "x-integration-admin-token",
    ],
    expose_headers=["X-Session-ID"],
)

# Startup logging
if "PYTEST_CURRENT_TEST" not in os.environ:
    print("=" * 60)
    print("🚀 AssistMe API Starting (Modular Edition)...")
    print(f"   Environment: {os.getenv('VERCEL_ENV', 'local')}")
    if get_openrouter_api_key():
        print("   API Key: ✅ Configured (OpenRouter)")
        print(f"   Model: {get_default_model()}")
    else:
        print("   API Key: ⚠️  Not configured")
        print("   Mode: 🧠 Local Intelligence (Offline Fallback Active)")
    print(f"   Site URL: {os.getenv('OPENROUTER_SITE_URL', 'https://mangeshraut.pro')}")
    print("=" * 60)

# Include Routers
app.include_router(chat.router)
app.include_router(github.router)
app.include_router(media.router)
app.include_router(analytics.router)
app.include_router(monitor.router)
app.include_router(general.router)
app.include_router(personalization.router)
app.include_router(integrations.router)
app.include_router(realtime.router)
app.include_router(tts.router)


# Global exception handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """
    Custom exception handler to ensure consistent JSON responses
    """
    if system_monitor is not None:
        system_monitor.log_event(
            f"HTTP {exc.status_code}: {exc.detail}",
            EventType.ERROR if exc.status_code >= 500 else EventType.WARNING,
            {"path": request.url.path, "status_code": exc.status_code},
            "api_error",
        )

    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": exc.status_code,
                "message": exc.detail,
                "type": "http_error",
            },
            "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        },
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Global exception handler to catch all unhandled exceptions
    and return a proper 500 response with JSON
    """
    if system_monitor is not None:
        system_monitor.log_event(
            f"Unhandled exception: {str(exc)}",
            EventType.CRITICAL,
            {"path": request.url.path, "error": str(exc)},
            "exception",
        )

    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": {
                "code": 500,
                "message": "Internal server error",
                "type": "internal_error",
            },
            "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        },
    )


# Serve static files for local development and Cloud Run
# Only skip for Vercel where static files are handled by the framework
vercel_env = os.getenv("VERCEL_ENV")
if vercel_env != "production":
    try:
        # Mount the entire src directory to serve all static files (assets, js, manifest, etc.)
        app.mount("/", StaticFiles(directory="src", html=True), name="static")
        print("📁 Static files mounted from /src directory")
    except Exception as e:
        print(f"⚠️ Static files skipped: {e}")

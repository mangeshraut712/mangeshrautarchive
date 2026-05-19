"""Vercel catch-all serverless function handler for /api/* routes."""
import os
import sys

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from api.index import app
except Exception as import_error:
    import traceback
    error_detail = f"{str(import_error)}\n{traceback.format_exc()}"
    print(f"Import error: {error_detail}", file=sys.stderr)

    # Create minimal fallback app
    from fastapi import FastAPI
    app = FastAPI()

    @app.get("/{path:path}")
    async def error_handler(path: str = ""):
        return {
            "error": "Import failed",
            "detail": str(import_error),
            "traceback": error_detail[:500]
        }

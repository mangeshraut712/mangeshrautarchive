"""Vercel catch-all serverless function handler for /api/* routes."""
import os
import sys

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from api.index import app
except Exception as _import_error:
    import traceback
    _error_msg = str(_import_error)
    _error_detail = f"{_error_msg}\n{traceback.format_exc()}"
    print(f"Import error: {_error_detail}", file=sys.stderr)

    # Create minimal fallback app
    from fastapi import FastAPI
    app = FastAPI()

    @app.get("/{path:path}")
    async def error_handler(path: str = "", error_msg: str = _error_msg, error_detail: str = _error_detail):
        return {
            "error": "Import failed",
            "detail": error_msg,
            "traceback": error_detail[:500]
        }

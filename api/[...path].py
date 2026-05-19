"""Catch-all Vercel Function for FastAPI routes under /api/*."""

import os
import sys

# Add the project root to the path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Store import error for error handler access
_import_error = None

try:
    # Import the FastAPI app from index.py
    from api.index import app  # type: ignore # noqa: F401
except Exception as e:
    import traceback
    _import_error = f"Failed to import app: {str(e)}\n{traceback.format_exc()}"
    print(_import_error, file=sys.stderr)

    # Create a minimal error app
    from fastapi import FastAPI
    app = FastAPI()

    @app.get("/{path:path}")
    async def error_handler(path: str):
        return {"error": "Import failed", "detail": _import_error, "path": path}

# Vercel expects an 'app' variable exposed at module level
# The app is imported above and exposed here for the serverless handler

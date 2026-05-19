"""Catch-all Vercel Function for FastAPI routes under /api/*."""

from .index import app  # type: ignore # noqa: F401

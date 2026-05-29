"""FastAPI Monitoring Middleware.
Extracted from monolithic monitoring.py to improve codebase structure.
"""

import time
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

from api.monitoring import SystemMonitor, EventType


class MonitoringMiddleware(BaseHTTPMiddleware):
    """Middleware to monitor all requests and ensure proper responses."""

    def __init__(self, app, monitor: SystemMonitor):
        super().__init__(app)
        self.monitor = monitor

    async def dispatch(self, request: Request, call_next):
        start_time = time.time()

        try:
            # Process request
            response = await call_next(request)

            # Calculate response time
            response_time = (time.time() - start_time) * 1000

            # Skip monitoring if monitor is not available (e.g., failed to initialize)
            if self.monitor is None:
                return response

            # Extract user agent and client IP
            user_agent = request.headers.get("user-agent", "unknown")
            forwarded = request.headers.get("x-forwarded-for")
            if forwarded:
                client_ip = forwarded.split(",")[0].strip()
            else:
                client_ip = request.client.host if request.client else "unknown"

            # Record metrics
            self.monitor.record_request(
                path=request.url.path,
                method=request.method,
                status_code=response.status_code,
                response_time_ms=response_time,
                user_agent=user_agent,
                client_ip=client_ip,
            )

            # Log slow requests
            if response_time > 5000:  # 5 seconds
                self.monitor.log_event(
                    f"Slow request: {request.method} {request.url.path} took {response_time:.0f}ms",
                    EventType.WARNING,
                    {"response_time_ms": response_time, "path": request.url.path},
                    "performance",
                )

            # Ensure we always return proper JSON for API endpoints
            if request.url.path.startswith("/api") and response.status_code >= 400:
                # Log the error
                if response.status_code >= 500:
                    self.monitor.log_event(
                        f"Server error {response.status_code}: {request.method} {request.url.path}",
                        EventType.ERROR,
                        {"status_code": response.status_code, "path": request.url.path},
                        "api_error",
                    )

            return response

        except Exception as e:
            # Calculate response time even for errors
            response_time = (time.time() - start_time) * 1000

            # Skip monitoring if monitor is not available
            if self.monitor is not None:
                # Log the exception
                self.monitor.log_event(
                    f"Unhandled exception in {request.method} {request.url.path}: {str(e)}",
                    EventType.ERROR,
                    {"error": str(e), "path": request.url.path},
                    "exception",
                )

                # Extract user agent and client IP for error logging
                user_agent = request.headers.get("user-agent", "unknown")
                forwarded = request.headers.get("x-forwarded-for")
                if forwarded:
                    client_ip = forwarded.split(",")[0].strip()
                else:
                    client_ip = request.client.host if request.client else "unknown"

                # Record as failed request
                self.monitor.record_request(
                    path=request.url.path,
                    method=request.method,
                    status_code=500,
                    response_time_ms=response_time,
                    user_agent=user_agent,
                    client_ip=client_ip,
                )

            # Re-raise to let FastAPI handle it with proper error responses
            raise

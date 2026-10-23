"""Baseline response headers for API responses.

These do not replace a document CSP. Microphone and geolocation stay available
on HTML pages; this middleware only wraps API responses.
"""

from starlette.datastructures import MutableHeaders

SECURITY_HEADERS = (
    ("x-content-type-options", "nosniff"),
    ("x-frame-options", "DENY"),
    ("referrer-policy", "strict-origin-when-cross-origin"),
    ("permissions-policy", "camera=(), microphone=(), geolocation=()"),
)
HSTS_VALUE = "max-age=63072000; includeSubDomains"


class SecurityHeadersMiddleware:
    """Add security headers without buffering streaming bodies."""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        async def send_with_security(message):
            if message["type"] == "http.response.start":
                headers = MutableHeaders(scope=message)
                for name, value in SECURITY_HEADERS:
                    if name not in headers:
                        headers[name] = value
                if _is_https(scope) and "strict-transport-security" not in headers:
                    headers["strict-transport-security"] = HSTS_VALUE
            await send(message)

        await self.app(scope, receive, send_with_security)


def _is_https(scope) -> bool:
    for key, value in scope.get("headers") or []:
        if key == b"x-forwarded-proto":
            proto = value.decode("latin1").split(",")[0].strip().lower()
            return proto == "https"
    return scope.get("scheme") == "https"

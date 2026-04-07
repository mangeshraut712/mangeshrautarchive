"""System Monitoring & Health Check Module for AssistMe API
Provides comprehensive health monitoring, logging, and metrics collection.
"""

import os
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field
from collections import deque
from enum import Enum

# Optional psutil import - graceful fallback if not available
try:
    import psutil
    PSUTIL_AVAILABLE = True
except ImportError:
    psutil = None
    PSUTIL_AVAILABLE = False

import httpx
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware


class HealthStatus(Enum):
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"
    UNKNOWN = "unknown"


class EventType(Enum):
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"
    SUCCESS = "success"


@dataclass
class HealthCheckResult:
    name: str
    status: HealthStatus
    response_time_ms: float
    message: str
    timestamp: str
    details: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self):
        return {
            "name": self.name,
            "status": self.status.value,
            "response_time_ms": round(self.response_time_ms, 2),
            "message": self.message,
            "timestamp": self.timestamp,
            "details": self.details
        }


@dataclass
class SystemEvent:
    id: str
    timestamp: str
    type: EventType
    message: str
    source: str
    details: Dict[str, Any] = field(default_factory=dict)
    resolved: bool = False
    resolved_at: Optional[str] = None

    def to_dict(self):
        return {
            "id": self.id,
            "timestamp": self.timestamp,
            "type": self.type.value,
            "message": self.message,
            "source": self.source,
            "details": self.details,
            "resolved": self.resolved,
            "resolved_at": self.resolved_at
        }


@dataclass
class EndpointMetrics:
    path: str
    method: str
    total_requests: int = 0
    successful_requests: int = 0
    failed_requests: int = 0
    avg_response_time_ms: float = 0.0
    last_status_code: int = 200
    last_checked: Optional[str] = None
    error_rate: float = 0.0

    def to_dict(self):
        return {
            "path": self.path,
            "method": self.method,
            "total_requests": self.total_requests,
            "successful_requests": self.successful_requests,
            "failed_requests": self.failed_requests,
            "avg_response_time_ms": round(self.avg_response_time_ms, 2),
            "last_status_code": self.last_status_code,
            "last_checked": self.last_checked,
            "error_rate": round(self.error_rate, 2)
        }


class SystemMonitor:
    """Centralized system monitoring and health checking."""

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return

        self._initialized = True
        self.events: deque = deque(maxlen=1000)
        self.endpoint_metrics: Dict[str, EndpointMetrics] = {}
        self.health_checks: Dict[str, HealthCheckResult] = {}
        self.system_stats: Dict[str, Any] = {}
        self.start_time = time.time()
        self.total_requests = 0
        self.error_count = 0

        # Service endpoints to monitor
        self.endpoints = [
            ("/api/health", "GET"),
            ("/api/status", "GET"),
            ("/api/models", "GET"),
            ("/api/github/profile", "GET"),
            ("/api", "GET"),
        ]

    def log_event(self, event_type: EventType, message: str, source: str, details: Dict = None):
        """Log a system event."""
        event = SystemEvent(
            id=f"evt_{int(time.time() * 1000)}_{len(self.events)}",
            timestamp=datetime.utcnow().isoformat() + "Z",
            type=event_type,
            message=message,
            source=source,
            details=details or {}
        )
        self.events.appendleft(event)

        # Also print for server logs
        emoji = {
            EventType.INFO: "ℹ️",
            EventType.WARNING: "⚠️",
            EventType.ERROR: "❌",
            EventType.CRITICAL: "🚨",
            EventType.SUCCESS: "✅"
        }.get(event_type, "ℹ️")

        print(f"{emoji} [{event.timestamp}] {source}: {message}")
        return event

    def record_request(self, path: str, method: str, status_code: int, response_time_ms: float):
        """Record API request metrics."""
        key = f"{method}:{path}"

        if key not in self.endpoint_metrics:
            self.endpoint_metrics[key] = EndpointMetrics(path=path, method=method)

        metric = self.endpoint_metrics[key]
        metric.total_requests += 1
        metric.last_status_code = status_code
        metric.last_checked = datetime.utcnow().isoformat() + "Z"

        if 200 <= status_code < 400:
            metric.successful_requests += 1
        else:
            metric.failed_requests += 1
            self.error_count += 1

        # Update average response time
        metric.avg_response_time_ms = (
            (metric.avg_response_time_ms * (metric.total_requests - 1) + response_time_ms)
            / metric.total_requests
        )

        # Calculate error rate
        if metric.total_requests > 0:
            metric.error_rate = (metric.failed_requests / metric.total_requests) * 100

        self.total_requests += 1

    async def check_health(self) -> Dict[str, Any]:
        """Perform comprehensive health checks."""
        checks = []
        start_time = time.time()

        # Check OpenRouter API
        openrouter_ok = await self._check_openrouter()
        checks.append(HealthCheckResult(
            name="OpenRouter API",
            status=HealthStatus.HEALTHY if openrouter_ok else HealthStatus.UNHEALTHY,
            response_time_ms=(time.time() - start_time) * 1000,
            message="OpenRouter API is accessible" if openrouter_ok else "OpenRouter API unavailable",
            timestamp=datetime.utcnow().isoformat() + "Z",
            details={"provider": "OpenRouter"}
        ))

        # Check system resources
        system_ok = self._check_system_resources()
        checks.append(HealthCheckResult(
            name="System Resources",
            status=system_ok["status"],
            response_time_ms=0,
            message=system_ok["message"],
            timestamp=datetime.utcnow().isoformat() + "Z",
            details=system_ok["details"]
        ))

        # Check memory manager
        memory_ok = self._check_memory_manager()
        checks.append(HealthCheckResult(
            name="Memory Manager",
            status=memory_ok["status"],
            response_time_ms=0,
            message=memory_ok["message"],
            timestamp=datetime.utcnow().isoformat() + "Z",
            details=memory_ok["details"]
        ))

        # Check GitHub integration
        github_ok = await self._check_github()
        checks.append(HealthCheckResult(
            name="GitHub Integration",
            status=HealthStatus.HEALTHY if github_ok else HealthStatus.DEGRADED,
            response_time_ms=0,
            message="GitHub API accessible" if github_ok else "GitHub API limited or unavailable",
            timestamp=datetime.utcnow().isoformat() + "Z"
        ))

        # Determine overall status
        overall_status = HealthStatus.HEALTHY
        for check in checks:
            self.health_checks[check.name] = check
            if check.status == HealthStatus.UNHEALTHY:
                overall_status = HealthStatus.UNHEALTHY
            elif check.status == HealthStatus.DEGRADED and overall_status != HealthStatus.UNHEALTHY:
                overall_status = HealthStatus.DEGRADED

        return {
            "status": overall_status.value,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "uptime_seconds": round(time.time() - self.start_time, 2),
            "total_requests": self.total_requests,
            "error_count": self.error_count,
            "error_rate": round((self.error_count / max(self.total_requests, 1)) * 100, 2),
            "checks": [check.to_dict() for check in checks]
        }

    async def _check_openrouter(self) -> bool:
        """Check if OpenRouter API is accessible."""
        try:
            api_key = os.getenv("OPENROUTER_API_KEY", "").strip()
            if not api_key:
                return False

            async with httpx.AsyncClient() as client:
                response = await client.get(
                    "https://openrouter.ai/api/v1/models",
                    headers={"Authorization": f"Bearer {api_key}"},
                    timeout=5.0
                )
                return response.status_code == 200
        except Exception as e:
            self.log_event(EventType.WARNING, f"OpenRouter check failed: {str(e)}", "health_check")
            return False

    def _check_system_resources(self) -> Dict:
        """Check system resource usage."""
        if not PSUTIL_AVAILABLE:
            return {
                "status": HealthStatus.UNKNOWN,
                "message": "System resource monitoring not available",
                "details": {}
            }

        try:
            cpu_percent = psutil.cpu_percent(interval=0.1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')

            # Determine status based on thresholds
            status = HealthStatus.HEALTHY
            message = "System resources are healthy"

            if cpu_percent > 90 or memory.percent > 90:
                status = HealthStatus.CRITICAL
                message = "Critical: High resource usage"
            elif cpu_percent > 70 or memory.percent > 80:
                status = HealthStatus.DEGRADED
                message = "Warning: Elevated resource usage"

            return {
                "status": status,
                "message": message,
                "details": {
                    "cpu_percent": cpu_percent,
                    "memory_percent": memory.percent,
                    "memory_available_gb": round(memory.available / (1024**3), 2),
                    "disk_percent": disk.percent,
                    "disk_free_gb": round(disk.free / (1024**3), 2)
                }
            }
        except Exception as e:
            return {
                "status": HealthStatus.UNKNOWN,
                "message": f"Could not check system resources: {str(e)}",
                "details": {}
            }

    def _check_memory_manager(self) -> Dict:
        """Check memory manager status."""
        try:
            from api.memory_manager import memory_manager
            stats = memory_manager.get_stats()

            return {
                "status": HealthStatus.HEALTHY,
                "message": "Memory manager is operational",
                "details": stats
            }
        except Exception as e:
            return {
                "status": HealthStatus.DEGRADED,
                "message": f"Memory manager issue: {str(e)}",
                "details": {}
            }

    async def _check_github(self) -> bool:
        """Check GitHub API accessibility."""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    "https://api.github.com/rate_limit",
                    timeout=5.0
                )
                return response.status_code == 200
        except Exception:
            return False

    def get_metrics(self) -> Dict[str, Any]:
        """Get comprehensive system metrics."""
        return {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "uptime_seconds": round(time.time() - self.start_time, 2),
            "total_requests": self.total_requests,
            "error_count": self.error_count,
            "error_rate": round((self.error_count / max(self.total_requests, 1)) * 100, 2),
            "endpoints": [metric.to_dict() for metric in self.endpoint_metrics.values()],
            "events_24h": len([e for e in self.events if self._is_recent(e.timestamp, hours=24)]),
            "critical_events": len([e for e in self.events if e.type == EventType.CRITICAL and not e.resolved])
        }

    def get_events(self, limit: int = 100, event_type: Optional[EventType] = None,
                   resolved_only: Optional[bool] = None) -> List[Dict]:
        """Get system events with optional filtering."""
        events = list(self.events)

        if event_type:
            events = [e for e in events if e.type == event_type]

        if resolved_only is not None:
            events = [e for e in events if e.resolved == resolved_only]

        return [e.to_dict() for e in events[:limit]]

    def resolve_event(self, event_id: str) -> bool:
        """Mark an event as resolved."""
        for event in self.events:
            if event.id == event_id:
                event.resolved = True
                event.resolved_at = datetime.utcnow().isoformat() + "Z"
                self.log_event(
                    EventType.SUCCESS,
                    f"Event resolved: {event.message}",
                    "event_resolution",
                    {"event_id": event_id}
                )
                return True
        return False

    def _is_recent(self, timestamp: str, hours: int = 24) -> bool:
        """Check if a timestamp is within recent hours."""
        try:
            event_time = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
            return datetime.now(event_time.tzinfo) - event_time < timedelta(hours=hours)
        except Exception:
            return False


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

            # Record metrics
            self.monitor.record_request(
                path=request.url.path,
                method=request.method,
                status_code=response.status_code,
                response_time_ms=response_time
            )

            # Log slow requests
            if response_time > 5000:  # 5 seconds
                self.monitor.log_event(
                    EventType.WARNING,
                    f"Slow request: {request.method} {request.url.path} took {response_time:.0f}ms",
                    "performance",
                    {"response_time_ms": response_time, "path": request.url.path}
                )

            # Ensure we always return proper JSON for API endpoints
            if request.url.path.startswith("/api") and response.status_code >= 400:
                # Log the error
                if response.status_code >= 500:
                    self.monitor.log_event(
                        EventType.ERROR,
                        f"Server error {response.status_code}: {request.method} {request.url.path}",
                        "api_error",
                        {"status_code": response.status_code, "path": request.url.path}
                    )

            return response

        except Exception as e:
            # Calculate response time even for errors
            response_time = (time.time() - start_time) * 1000

            # Log the exception
            self.monitor.log_event(
                EventType.ERROR,
                f"Unhandled exception in {request.method} {request.url.path}: {str(e)}",
                "exception",
                {"error": str(e), "path": request.url.path}
            )

            # Record as failed request
            self.monitor.record_request(
                path=request.url.path,
                method=request.method,
                status_code=500,
                response_time_ms=response_time
            )

            # Re-raise to let FastAPI handle it with proper error responses
            raise


# Global monitor instance
system_monitor = SystemMonitor()

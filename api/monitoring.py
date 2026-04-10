"""System Monitoring & Health Check Module for AssistMe API
Provides comprehensive health monitoring, logging, and metrics collection.
"""

import asyncio
import os
import time
import json
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field
from collections import deque
from enum import Enum
import logging
from urllib.parse import urlsplit

# Optional psutil import - graceful fallback if not available
try:
    import psutil  # type: ignore

    PSUTIL_AVAILABLE = True
except ImportError:
    psutil = None  # type: ignore
    PSUTIL_AVAILABLE = False

import httpx
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

# Configure logging for 2026-era monitoring
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class HealthStatus(Enum):
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"
    CRITICAL = "critical"
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
            "details": self.details,
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
            "resolved_at": self.resolved_at,
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
            "error_rate": round(self.error_rate, 2),
        }


class SystemMonitor:
    _instance = None
    _lock = asyncio.Lock()

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        if hasattr(self, "_initialized"):
            return
        self._initialized = True

        # Core metrics storage
        self.request_counts = {}
        self.response_times = deque(maxlen=1000)
        self.error_counts = {}
        self.endpoint_metrics = {}
        self.events = deque(maxlen=500)

        # System monitoring
        self.start_time = time.time()

        # Poster API tracking
        self.poster_requests = {"success": 0, "failure": 0}

        # Deployment tracking (2026-era feature)
        self.deployment_history = deque(maxlen=50)
        self.current_deployment = None
        self.deployment_changes = deque(maxlen=100)

        # Real-time metrics (2026-era feature)
        self.real_time_metrics = {
            "active_connections": 0,
            "requests_per_second": 0,
            "error_rate_per_minute": 0,
            "memory_trend": deque(maxlen=60),  # 1 hour of minute-by-minute data
            "cpu_trend": deque(maxlen=60),
            "response_time_trend": deque(maxlen=60),
            "uptime_seconds": 0,
            "last_deployment": None,
        }

        # Security monitoring (2026-era feature)
        self.security_events = deque(maxlen=200)
        self.suspicious_ips = set()
        self.rate_limits = {}

        # 2026-era AI monitoring
        self.ai_metrics = {
            "openrouter_requests": 0,
            "openrouter_errors": 0,
            "ai_response_times": deque(maxlen=100),
            "model_usage": {},
            "token_usage": {"input": 0, "output": 0},
        }

        # Web vitals monitoring (2026-era)
        self.web_vitals = {
            "cls": deque(maxlen=100),  # Cumulative Layout Shift
            "fid": deque(maxlen=100),  # First Input Delay
            "lcp": deque(maxlen=100),  # Largest Contentful Paint
            "fcp": deque(maxlen=100),  # First Contentful Paint
            "ttfb": deque(maxlen=100),  # Time to First Byte
        }

        # Initialize computed properties
        self.total_requests = 0
        self.error_count = 0

        # Last.fm configuration
        self.lastfm_username = os.getenv("LASTFM_USERNAME", "mbr63")
        self.lastfm_api_key = os.getenv(
            "LASTFM_API_KEY", "bef46b0d7702dac5b071906cd186bd28"
        )

        # Initialize with deployment info
        self.load_deployment_info()

        logger.info("🖥️  System Monitor initialized with 2026-era capabilities")

    def format_uptime(self, seconds: float) -> str:
        """Format uptime in human-readable format"""
        days, remainder = divmod(int(seconds), 86400)
        hours, remainder = divmod(remainder, 3600)
        minutes, seconds = divmod(remainder, 60)

        parts = []
        if days > 0:
            parts.append(f"{days}d")
        if hours > 0:
            parts.append(f"{hours}h")
        if minutes > 0:
            parts.append(f"{minutes}m")
        if seconds > 0 or not parts:
            parts.append(f"{seconds}s")

        return " ".join(parts)

    def log_event(
        self,
        message: str,
        event_type: EventType = EventType.INFO,
        metadata: Optional[Dict[str, Any]] = None,
        source: str = "system",
    ):
        """Log an event with timestamp and metadata"""
        event = SystemEvent(
            id=hashlib.md5(
                f"{datetime.now(timezone.utc).isoformat()}-{message}".encode()
            ).hexdigest()[:8],
            timestamp=datetime.now(timezone.utc).isoformat(),
            type=event_type,
            message=message,
            source=source,
            details=metadata or {},
        )
        self.events.append(event)

        # Log to system logger based on severity
        if event_type == EventType.CRITICAL:
            logger.critical(message)
        elif event_type == EventType.ERROR:
            logger.error(message)
        elif event_type == EventType.WARNING:
            logger.warning(message)
        else:
            logger.info(message)

    def record_request(
        self,
        method: str,
        path: str,
        status_code: int,
        response_time_ms: float,
        user_agent: str = "",
        client_ip: str = "",
    ):
        """Record a request for metrics tracking"""
        self.total_requests += 1

        endpoint = f"{method}:{path}"
        if endpoint not in self.endpoint_metrics:
            self.endpoint_metrics[endpoint] = EndpointMetrics(path=path, method=method)

        metrics = self.endpoint_metrics[endpoint]
        metrics.total_requests += 1
        metrics.last_status_code = status_code
        metrics.last_checked = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
        metrics.avg_response_time_ms = (
            (metrics.avg_response_time_ms * (metrics.total_requests - 1)) + response_time_ms
        ) / max(metrics.total_requests, 1)

        if 200 <= status_code < 400:
            metrics.successful_requests += 1
        else:
            metrics.failed_requests += 1
            self.error_count += 1
            self.error_counts[endpoint] = self.error_counts.get(endpoint, 0) + 1

        metrics.error_rate = (
            (metrics.failed_requests / max(metrics.total_requests, 1)) * 100
        )

        self.request_counts[endpoint] = self.request_counts.get(endpoint, 0) + 1
        self.response_times.append(response_time_ms)
        self.real_time_metrics["requests_per_second"] = self._calculate_rps()

        if status_code == 403:
            self.log_event(
                f"Security event: {method} {path} from {client_ip or 'unknown client'}",
                EventType.WARNING,
                {
                    "method": method,
                    "path": path,
                    "ip": client_ip,
                    "status": status_code,
                    "user_agent": user_agent,
                },
                "security_monitor",
            )

    def _calculate_rps(self) -> float:
        """Calculate requests per second from recent activity"""
        # Simple RPS calculation based on total requests and uptime
        uptime_hours = (time.time() - self.start_time) / 3600
        if uptime_hours > 0:
            return self.total_requests / (uptime_hours * 3600)
        return 0.0

    def record_poster_request(self, success: bool):
        """Record poster API request for analytics"""
        if success:
            self.poster_requests["success"] += 1
        else:
            self.poster_requests["failure"] += 1

    def load_deployment_info(self):
        """Load deployment information from environment and track changes"""
        try:
            deployment_info = {
                "version": os.getenv("VERCEL_GIT_COMMIT_SHA", "unknown")[:8],
                "environment": os.getenv("VERCEL_ENV", "local"),
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "platform": "vercel" if os.getenv("VERCEL") else "local",
                "region": os.getenv("VERCEL_REGION", "unknown"),
                "url": os.getenv("VERCEL_URL", "localhost"),
            }

            # Track deployment changes
            if self.current_deployment:
                changes = self.detect_deployment_changes(
                    self.current_deployment, deployment_info
                )
                if changes:
                    self.log_deployment_change(changes)

            self.current_deployment = deployment_info
            self.real_time_metrics["last_deployment"] = deployment_info["timestamp"]

            logger.info(f"📦 Deployment info loaded: {deployment_info}")

        except Exception as e:
            logger.error(f"Failed to load deployment info: {e}")

    def _normalize_public_origin(self, raw_value: Optional[str], fallback: str) -> str:
        candidate = (raw_value or fallback or "").strip()
        if not candidate:
            return fallback.rstrip("/")
        if not candidate.startswith(("http://", "https://")):
            candidate = f"https://{candidate.lstrip('/')}"
        return candidate.rstrip("/")

    def get_public_origins(self) -> Dict[str, str]:
        custom_domain = self._normalize_public_origin(
            os.getenv("OPENROUTER_SITE_URL") or os.getenv("SITE_URL"),
            "https://mangeshraut.pro",
        )
        vercel_origin = self._normalize_public_origin(
            os.getenv("NEXT_PUBLIC_API_BASE") or os.getenv("VERCEL_PUBLIC_URL"),
            "https://mangeshrautarchive.vercel.app",
        )
        github_pages = self._normalize_public_origin(
            os.getenv("GITHUB_PAGES_URL"),
            "https://mangeshraut712.github.io/mangeshrautarchive",
        )

        return {
            "custom_domain": custom_domain,
            "vercel_deployment": vercel_origin,
            "github_pages": github_pages,
        }

    def get_runtime_environment(self) -> Dict[str, Any]:
        deployment = self.current_deployment or {}
        public_origins = self.get_public_origins()

        return {
            "platform": deployment.get("platform", "local"),
            "environment": deployment.get("environment", "local"),
            "region": deployment.get("region", "unknown"),
            "version": deployment.get("version", "unknown"),
            "deployment_url": deployment.get("url", "localhost"),
            "public_origins": public_origins,
            "env_presence": {
                "github_token": bool(
                    (os.getenv("GITHUB_TOKEN") or os.getenv("GITHUB_PAT") or "").strip()
                ),
                "openrouter_api_key": bool(os.getenv("OPENROUTER_API_KEY", "").strip()),
                "lastfm_api_key": bool(os.getenv("LASTFM_API_KEY", "").strip()),
                "vercel_url": bool(os.getenv("VERCEL_URL", "").strip()),
                "next_public_api_base": bool(
                    os.getenv("NEXT_PUBLIC_API_BASE", "").strip()
                ),
                "github_pages_url": bool(os.getenv("GITHUB_PAGES_URL", "").strip()),
            },
        }

    def _build_status_summary(self, entries: List[Dict[str, Any]]) -> Dict[str, int]:
        return {
            "healthy": len(
                [entry for entry in entries if entry["status"] == HealthStatus.HEALTHY.value]
            ),
            "degraded": len(
                [entry for entry in entries if entry["status"] == HealthStatus.DEGRADED.value]
            ),
            "unhealthy": len(
                [
                    entry
                    for entry in entries
                    if entry["status"] == HealthStatus.UNHEALTHY.value
                ]
            ),
            "total": len(entries),
        }

    def detect_deployment_changes(
        self, old_deployment: Dict, new_deployment: Dict
    ) -> List[str]:
        """Detect changes between deployments for audit logging"""
        changes = []

        for key in ["version", "environment", "platform", "region", "url"]:
            old_val = old_deployment.get(key)
            new_val = new_deployment.get(key)
            if old_val != new_val:
                changes.append(f"{key}: {old_val} → {new_val}")

        return changes

    def log_deployment_change(self, changes: List[str]):
        """Log deployment changes for audit trail"""
        change_record = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "type": "deployment_change",
            "changes": changes,
            "deployment": self.current_deployment,
        }

        self.deployment_changes.append(change_record)
        self.log_event(
            f"🚀 Deployment updated: {', '.join(changes)}",
            EventType.SUCCESS,
            {"changes": changes},
            "deployment",
        )

        logger.info(f"📝 Deployment change logged: {changes}")

    def track_web_vitals(self, vitals_data: Dict[str, float]):
        """Track Core Web Vitals for performance monitoring"""
        for metric, value in vitals_data.items():
            if metric in self.web_vitals:
                self.web_vitals[metric].append(
                    {
                        "value": value,
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                    }
                )

                # Check performance thresholds
                if metric == "lcp" and value > 2500:  # LCP > 2.5s
                    self.log_event(
                        f"⚠️ Poor LCP performance: {value}ms",
                        EventType.WARNING,
                        {"metric": metric, "value": value},
                        "performance",
                    )
                elif metric == "cls" and value > 0.1:  # CLS > 0.1
                    self.log_event(
                        f"⚠️ Layout shift detected: {value}",
                        EventType.WARNING,
                        {"metric": metric, "value": value},
                        "performance",
                    )

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
                    timeout=5.0,
                )
                return response.status_code == 200
        except Exception as e:
            self.log_event(
                f"OpenRouter check failed: {str(e)}",
                EventType.WARNING,
                {"error": str(e)},
                "health_check",
            )
            return False

    def _check_system_resources(self) -> Dict:
        if not PSUTIL_AVAILABLE or psutil is None:
            return {
                "status": HealthStatus.UNKNOWN,
                "message": "System resource monitoring not available",
                "details": {},
            }

        try:
            cpu_percent = psutil.cpu_percent(interval=0.1)  # type: ignore
            memory = psutil.virtual_memory()  # type: ignore
            disk = psutil.disk_usage("/")  # type: ignore

            status = HealthStatus.HEALTHY
            message = "System resources are healthy"

            if cpu_percent > 90 or memory.percent > 90:
                status = HealthStatus.CRITICAL
                message = "Critical: High resource usage"
            elif cpu_percent > 70 or memory.percent > 80 or disk.percent > 85:
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
                    "disk_free_gb": round(disk.free / (1024**3), 2),
                },
            }
        except Exception as e:
            logger.warning(f"System resource check failed: {e}")
            return {
                "status": HealthStatus.UNKNOWN,
                "message": f"Could not check system resources: {str(e)}",
                "details": {},
            }

    def _check_memory_manager(self) -> Dict:
        """Check memory manager status."""
        try:
            from .memory_manager import memory_manager

            stats = memory_manager.get_stats()

            return {
                "status": HealthStatus.HEALTHY,
                "message": "Memory manager is operational",
                "details": stats,
            }
        except Exception as e:
            return {
                "status": HealthStatus.DEGRADED,
                "message": f"Memory manager issue: {str(e)}",
                "details": {},
            }

    async def _check_github(self) -> bool:
        """Check GitHub API accessibility."""
        try:
            headers = {}
            access_token = (
                os.getenv("GITHUB_TOKEN", "").strip()
                or os.getenv("GITHUB_PAT", "").strip()
            )
            if access_token:
                headers["Authorization"] = f"Bearer {access_token}"

            async with httpx.AsyncClient() as client:
                response = await client.get(
                    "https://api.github.com/rate_limit",
                    headers=headers,
                    timeout=5.0,
                )
                return response.status_code == 200
        except Exception:
            return False

    async def check_health(self) -> Dict[str, Any]:
        """Return monitor health payload for the frontend dashboard and health endpoint."""
        timestamp = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
        checks: List[HealthCheckResult] = []

        openrouter_ok = await self._check_openrouter()
        checks.append(
            HealthCheckResult(
                name="OpenRouter API",
                status=HealthStatus.HEALTHY if openrouter_ok else HealthStatus.DEGRADED,
                response_time_ms=0,
                message=(
                    "OpenRouter API reachable"
                    if openrouter_ok
                    else "OpenRouter API unavailable or not configured"
                ),
                timestamp=timestamp,
            )
        )

        system_resources = self._check_system_resources()
        checks.append(
            HealthCheckResult(
                name="System Resources",
                status=system_resources["status"],
                response_time_ms=0,
                message=system_resources["message"],
                timestamp=timestamp,
                details=system_resources.get("details", {}),
            )
        )

        memory_status = self._check_memory_manager()
        checks.append(
            HealthCheckResult(
                name="Memory Manager",
                status=memory_status["status"],
                response_time_ms=0,
                message=memory_status["message"],
                timestamp=timestamp,
                details=memory_status.get("details", {}),
            )
        )

        github_ok = await self._check_github()
        checks.append(
            HealthCheckResult(
                name="GitHub API",
                status=HealthStatus.HEALTHY if github_ok else HealthStatus.DEGRADED,
                response_time_ms=0,
                message=(
                    "GitHub API reachable"
                    if github_ok
                    else "GitHub API limited or temporarily unavailable"
                ),
                timestamp=timestamp,
            )
        )

        overall = HealthStatus.HEALTHY
        for check in checks:
            if check.status == HealthStatus.CRITICAL:
                overall = HealthStatus.CRITICAL
                break
            if check.status == HealthStatus.UNHEALTHY:
                overall = HealthStatus.UNHEALTHY
            elif check.status == HealthStatus.DEGRADED and overall == HealthStatus.HEALTHY:
                overall = HealthStatus.DEGRADED

        uptime_seconds = round(time.time() - self.start_time, 2)
        return {
            "status": overall.value,
            "timestamp": timestamp,
            "uptime_seconds": uptime_seconds,
            "uptime_human": self.format_uptime(uptime_seconds),
            "total_requests": self.total_requests,
            "error_count": self.error_count,
            "error_rate": round((self.error_count / max(self.total_requests, 1)) * 100, 2),
            "checks": [check.to_dict() for check in checks],
        }

    async def get_external_services_status(self) -> Dict[str, Any]:
        """Get live status information for key third-party and analytics integrations."""
        services = await asyncio.gather(
            self._probe_openrouter_service(),
            self._probe_github_service(),
            self._probe_vercel_platform_service(),
            self._probe_lastfm_service(),
            self._probe_analytics_service(),
        )

        return {
            "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
            "summary": self._build_status_summary(services),
            "services": services,
        }

    async def get_hosting_surfaces_status(self) -> Dict[str, Any]:
        """Get live status for public hosting surfaces and runtime configuration."""
        public_origins = self.get_public_origins()
        surfaces = await asyncio.gather(
            self._probe_monitor_surface(
                "Custom Domain",
                public_origins["custom_domain"],
            ),
            self._probe_monitor_surface(
                "Vercel Deployment",
                public_origins["vercel_deployment"],
            ),
            self._probe_github_pages_surface(public_origins["github_pages"]),
        )

        return {
            "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
            "summary": self._build_status_summary(surfaces),
            "runtime": self.get_runtime_environment(),
            "surfaces": surfaces,
        }

    async def _probe_openrouter_service(self) -> Dict[str, Any]:
        api_key = os.getenv("OPENROUTER_API_KEY", "").strip()
        if not api_key:
            return {
                "name": "OpenRouter AI",
                "status": HealthStatus.DEGRADED.value,
                "message": "API key is not configured for server-side AI requests.",
                "metric_value": "CONFIG",
                "metric_label": "add OPENROUTER_API_KEY",
            }

        start = time.time()
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    "https://openrouter.ai/api/v1/models",
                    headers={"Authorization": f"Bearer {api_key}"},
                    timeout=5.0,
                )

            latency = round((time.time() - start) * 1000)
            if response.status_code == 200:
                payload = response.json()
                model_count = len(payload.get("data", []))
                return {
                    "name": "OpenRouter AI",
                    "status": HealthStatus.HEALTHY.value,
                    "message": "Model catalog reachable from the monitor backend.",
                    "metric_value": f"{latency}ms",
                    "metric_label": f"{model_count} models visible",
                }

            return {
                "name": "OpenRouter AI",
                "status": HealthStatus.UNHEALTHY.value,
                "message": f"OpenRouter returned HTTP {response.status_code}.",
                "metric_value": f"{latency}ms",
                "metric_label": "request failed",
            }
        except Exception as exc:
            return {
                "name": "OpenRouter AI",
                "status": HealthStatus.UNHEALTHY.value,
                "message": f"OpenRouter check failed: {str(exc)}",
                "metric_value": "ERROR",
                "metric_label": "network failure",
            }

    async def _probe_github_service(self) -> Dict[str, Any]:
        start = time.time()
        try:
            headers = {}
            access_token = (
                os.getenv("GITHUB_TOKEN", "").strip()
                or os.getenv("GITHUB_PAT", "").strip()
            )
            if access_token:
                headers["Authorization"] = f"Bearer {access_token}"

            async with httpx.AsyncClient() as client:
                response = await client.get(
                    "https://api.github.com/rate_limit",
                    headers=headers,
                    timeout=5.0,
                )

            latency = round((time.time() - start) * 1000)
            if response.status_code != 200:
                return {
                    "name": "GitHub API",
                    "status": (
                        HealthStatus.DEGRADED.value
                        if response.status_code in {403, 429}
                        else HealthStatus.UNHEALTHY.value
                    ),
                    "message": f"GitHub returned HTTP {response.status_code}.",
                    "metric_value": f"{latency}ms",
                    "metric_label": (
                        "rate limited"
                        if response.status_code in {403, 429}
                        else "request failed"
                    ),
                }

            payload = response.json()
            core = payload.get("resources", {}).get("core", {})
            remaining = core.get("remaining", 0)
            limit = core.get("limit", 0)
            status = HealthStatus.HEALTHY if remaining > 10 else HealthStatus.DEGRADED
            return {
                "name": "GitHub API",
                "status": status.value,
                "message": "Repository and activity data can be fetched live.",
                "metric_value": f"{remaining}/{limit}",
                "metric_label": "core requests left",
            }
        except Exception as exc:
            return {
                "name": "GitHub API",
                "status": HealthStatus.UNHEALTHY.value,
                "message": f"GitHub check failed: {str(exc)}",
                "metric_value": "ERROR",
                "metric_label": "network failure",
            }

    async def _probe_vercel_platform_service(self) -> Dict[str, Any]:
        start = time.time()
        try:
            async with httpx.AsyncClient(follow_redirects=True) as client:
                response = await client.get(
                    "https://www.vercel-status.com/api/v2/summary.json",
                    timeout=5.0,
                )

            latency = round((time.time() - start) * 1000)
            if response.status_code != 200:
                return {
                    "name": "Vercel Platform Status",
                    "status": HealthStatus.UNHEALTHY.value,
                    "message": f"Vercel status returned HTTP {response.status_code}.",
                    "metric_value": f"{latency}ms",
                    "metric_label": "status page error",
                }

            payload = response.json()
            indicator = (
                payload.get("status", {}).get("indicator", "") or ""
            ).lower()
            description = payload.get("status", {}).get(
                "description", "Status page reachable."
            )
            if indicator in {"none", "operational"}:
                status = HealthStatus.HEALTHY
            elif indicator in {"minor", "maintenance"}:
                status = HealthStatus.DEGRADED
            else:
                status = HealthStatus.UNHEALTHY

            return {
                "name": "Vercel Platform Status",
                "status": status.value,
                "message": description,
                "metric_value": f"{latency}ms",
                "metric_label": indicator or "status api",
            }
        except Exception as exc:
            return {
                "name": "Vercel Platform Status",
                "status": HealthStatus.UNHEALTHY.value,
                "message": f"Vercel status check failed: {str(exc)}",
                "metric_value": "ERROR",
                "metric_label": "network failure",
            }

    async def _probe_lastfm_service(self) -> Dict[str, Any]:
        start = time.time()
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    "https://ws.audioscrobbler.com/2.0/",
                    params={
                        "method": "user.getrecenttracks",
                        "user": self.lastfm_username,
                        "api_key": self.lastfm_api_key,
                        "format": "json",
                        "limit": 1,
                    },
                    timeout=6.0,
                )

            latency = round((time.time() - start) * 1000)
            if response.status_code != 200:
                return {
                    "name": "Last.fm API",
                    "status": HealthStatus.UNHEALTHY.value,
                    "message": f"Last.fm returned HTTP {response.status_code}.",
                    "metric_value": f"{latency}ms",
                    "metric_label": "request failed",
                }

            payload = response.json()
            if payload.get("error"):
                return {
                    "name": "Last.fm API",
                    "status": HealthStatus.DEGRADED.value,
                    "message": payload.get("message", "Last.fm rejected the request."),
                    "metric_value": f"{latency}ms",
                    "metric_label": "API warning",
                }

            recent_tracks = payload.get("recenttracks", {}).get("track", [])
            track = (
                recent_tracks[0]
                if isinstance(recent_tracks, list) and recent_tracks
                else {}
            )
            track_name = track.get("name") or "recent track"

            return {
                "name": "Last.fm API",
                "status": HealthStatus.HEALTHY.value,
                "message": "Music activity feed is responding.",
                "metric_value": f"{latency}ms",
                "metric_label": track_name,
            }
        except Exception as exc:
            return {
                "name": "Last.fm API",
                "status": HealthStatus.UNHEALTHY.value,
                "message": f"Last.fm check failed: {str(exc)}",
                "metric_value": "ERROR",
                "metric_label": "network failure",
            }

    async def _probe_analytics_service(self) -> Dict[str, Any]:
        try:
            from .index import get_analytics_views

            payload = await get_analytics_views()
            views = payload.get("views", {}).get("total", 0)
            storage_backend = payload.get("storage", {}).get("backend", "unknown")
            persistent = payload.get("storage", {}).get("persistent", False)

            return {
                "name": "Portfolio Analytics",
                "status": HealthStatus.HEALTHY.value,
                "message": "Portfolio analytics endpoint is serving view data.",
                "metric_value": str(views),
                "metric_label": f"{storage_backend} {'persistent' if persistent else 'fallback'}",
            }
        except Exception as exc:
            return {
                "name": "Portfolio Analytics",
                "status": HealthStatus.DEGRADED.value,
                "message": f"Analytics check failed: {str(exc)}",
                "metric_value": "ERROR",
                "metric_label": "endpoint failure",
            }

    async def _probe_monitor_surface(self, name: str, origin: str) -> Dict[str, Any]:
        status_url = f"{origin}/api/monitor/status"
        page_url = f"{origin}/monitor.html"
        start = time.time()
        try:
            async with httpx.AsyncClient(follow_redirects=True) as client:
                response = await client.get(status_url, timeout=6.0)

            latency = round((time.time() - start) * 1000)
            if response.status_code != 200:
                try:
                    async with httpx.AsyncClient(follow_redirects=True) as client:
                        page_response = await client.get(page_url, timeout=6.0)
                    if page_response.status_code == 200:
                        return {
                            "name": name,
                            "status": HealthStatus.DEGRADED.value,
                            "message": f"{name} UI is published, but /api/monitor/status returned HTTP {response.status_code}.",
                            "metric_value": f"{latency}ms",
                            "metric_label": urlsplit(origin).netloc or origin,
                            "url": origin,
                        }
                except Exception:
                    pass

                return {
                    "name": name,
                    "status": HealthStatus.UNHEALTHY.value,
                    "message": f"{name} monitor endpoint returned HTTP {response.status_code}.",
                    "metric_value": f"{latency}ms",
                    "metric_label": urlsplit(origin).netloc or origin,
                    "url": origin,
                }

            payload = response.json()
            environment = payload.get("environment", "unknown")
            version = payload.get("version", "unknown")
            return {
                "name": name,
                "status": HealthStatus.HEALTHY.value,
                "message": f"{name} is serving live monitor data.",
                "metric_value": payload.get("uptime_human", "LIVE"),
                "metric_label": f"{environment} · {version}",
                "url": origin,
            }
        except Exception as exc:
            try:
                async with httpx.AsyncClient(follow_redirects=True) as client:
                    page_response = await client.get(page_url, timeout=6.0)
                if page_response.status_code == 200:
                    return {
                        "name": name,
                        "status": HealthStatus.DEGRADED.value,
                        "message": f"{name} UI is reachable, but the monitor API is unavailable.",
                        "metric_value": "ERROR",
                        "metric_label": urlsplit(origin).netloc or origin,
                        "url": origin,
                    }
            except Exception:
                pass

            return {
                "name": name,
                "status": HealthStatus.UNHEALTHY.value,
                "message": f"{name} check failed: {str(exc)}",
                "metric_value": "ERROR",
                "metric_label": urlsplit(origin).netloc or origin,
                "url": origin,
            }

    async def _probe_github_pages_surface(self, origin: str) -> Dict[str, Any]:
        monitor_url = f"{origin}/monitor.html"
        config_url = f"{origin}/build-config.json"
        start = time.time()
        try:
            async with httpx.AsyncClient(follow_redirects=True) as client:
                monitor_response, config_response = await asyncio.gather(
                    client.get(monitor_url, timeout=6.0),
                    client.get(config_url, timeout=6.0),
                )

            latency = round((time.time() - start) * 1000)
            if monitor_response.status_code != 200:
                return {
                    "name": "GitHub Pages",
                    "status": HealthStatus.UNHEALTHY.value,
                    "message": f"GitHub Pages returned HTTP {monitor_response.status_code}.",
                    "metric_value": f"{latency}ms",
                    "metric_label": urlsplit(origin).netloc or origin,
                    "url": origin,
                }

            api_origin = ""
            if config_response.status_code == 200:
                try:
                    api_origin = (
                        config_response.json().get("apiBaseUrl", "") or ""
                    ).strip()
                except json.JSONDecodeError:
                    api_origin = ""

            status = HealthStatus.HEALTHY if api_origin else HealthStatus.DEGRADED
            return {
                "name": "GitHub Pages",
                "status": status.value,
                "message": (
                    "Static monitor is published and points at a live API origin."
                    if api_origin
                    else "Static monitor is reachable but build-config.json is missing an API origin."
                ),
                "metric_value": f"{latency}ms",
                "metric_label": (
                    urlsplit(api_origin).netloc
                    if api_origin
                    else "static shell only"
                ),
                "url": origin,
            }
        except Exception as exc:
            return {
                "name": "GitHub Pages",
                "status": HealthStatus.UNHEALTHY.value,
                "message": f"GitHub Pages check failed: {str(exc)}",
                "metric_value": "ERROR",
                "metric_label": urlsplit(origin).netloc or origin,
                "url": origin,
            }

    def get_metrics(self) -> Dict[str, Any]:
        """Get comprehensive system metrics."""
        uptime_seconds = round(time.time() - self.start_time, 2)
        endpoints = [metric.to_dict() for metric in self.endpoint_metrics.values()]
        resolved_events = len([event for event in self.events if event.resolved])
        unresolved_events = len([event for event in self.events if not event.resolved])

        return {
            "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
            "uptime_seconds": uptime_seconds,
            "uptime_human": self.format_uptime(uptime_seconds),
            "total_requests": self.total_requests,
            "error_count": self.error_count,
            "error_rate": round(
                (self.error_count / max(self.total_requests, 1)) * 100, 2
            ),
            "endpoints": endpoints,
            "summary": {
                "monitored_endpoints": len(endpoints),
                "resolved_events": resolved_events,
                "unresolved_events": unresolved_events,
                "critical_events": len(
                    [
                        e
                        for e in self.events
                        if e.type == EventType.CRITICAL and not e.resolved
                    ]
                ),
            },
            "events_24h": len(
                [e for e in self.events if self._is_recent(e.timestamp, hours=24)]
            ),
            "critical_events": len(
                [
                    e
                    for e in self.events
                    if e.type == EventType.CRITICAL and not e.resolved
                ]
            ),
        }

    def get_events(
        self,
        limit: int = 100,
        event_type: Optional[EventType] = None,
        resolved_only: Optional[bool] = None,
    ) -> List[Dict]:
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
                event.resolved_at = (
                    datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
                )
                self.log_event(
                    f"Event resolved: {event.message}",
                    EventType.SUCCESS,
                    {"event_id": event_id},
                    "event_resolution",
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
                response_time_ms=response_time,
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

            # Log the exception
            self.monitor.log_event(
                f"Unhandled exception in {request.method} {request.url.path}: {str(e)}",
                EventType.ERROR,
                {"error": str(e), "path": request.url.path},
                "exception",
            )

            # Record as failed request
            self.monitor.record_request(
                path=request.url.path,
                method=request.method,
                status_code=500,
                response_time_ms=response_time,
            )

            # Re-raise to let FastAPI handle it with proper error responses
            raise


# Global monitor instance
system_monitor = SystemMonitor()

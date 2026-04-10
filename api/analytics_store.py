import asyncio
import json
import os
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List

import httpx


class PortfolioAnalyticsStore:
    def __init__(self):
        self._lock = asyncio.Lock()
        self._session_ttl_seconds = 30 * 60
        self._file_path = Path(__file__).with_name("analytics_data.json")
        self._redis_url = (
            os.getenv("UPSTASH_REDIS_REST_URL", "").strip()
            or os.getenv("REDIS_REST_URL", "").strip()
        ).rstrip("/")
        self._redis_token = (
            os.getenv("UPSTASH_REDIS_REST_TOKEN", "").strip()
            or os.getenv("REDIS_REST_TOKEN", "").strip()
        )

    @property
    def backend_name(self) -> str:
        return "redis" if self.redis_enabled else "file"

    @property
    def redis_enabled(self) -> bool:
        return bool(self._redis_url and self._redis_token)

    def _today_key(self) -> str:
        return datetime.now(timezone.utc).strftime("%Y-%m-%d")

    def _week_key(self) -> str:
        now = datetime.now(timezone.utc)
        iso_year, iso_week, _ = now.isocalendar()
        return f"{iso_year}-W{iso_week:02d}"

    def _month_key(self) -> str:
        return datetime.now(timezone.utc).strftime("%Y-%m")

    async def _redis_pipeline(self, commands: List[List[str]]) -> List[Any]:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.post(
                f"{self._redis_url}/pipeline",
                headers={"Authorization": f"Bearer {self._redis_token}"},
                json=commands,
            )
            response.raise_for_status()
            payload = response.json()
            return [item.get("result") for item in payload]

    def _initial_data(self) -> Dict[str, Any]:
        return {
            "total_views": 0,
            "homepage_views": 0,
            "unique_visitors": 0,
            "daily_views": {},
            "weekly_views": {},
            "monthly_views": {},
            "recent_sessions": {},
            "first_seen": None,
            "last_updated": None,
        }

    async def _load_file_data(self) -> Dict[str, Any]:
        if not self._file_path.exists():
            return self._initial_data()

        try:
            return json.loads(self._file_path.read_text())
        except (json.JSONDecodeError, OSError):
            return self._initial_data()

    async def _save_file_data(self, data: Dict[str, Any]) -> None:
        self._file_path.write_text(json.dumps(data))

    def _prune_sessions(self, sessions: Dict[str, float]) -> Dict[str, float]:
        cutoff = time.time() - self._session_ttl_seconds
        return {
            session_id: last_seen
            for session_id, last_seen in sessions.items()
            if last_seen >= cutoff
        }

    async def track_visit(
        self,
        session_id: str,
        path: str,
        is_homepage: bool,
        referrer: str = "",
        user_agent: str = "",
    ) -> Dict[str, Any]:
        if self.redis_enabled:
            return await self._track_visit_redis(session_id, path, is_homepage)
        return await self._track_visit_file(session_id, path, is_homepage, referrer, user_agent)

    async def _track_visit_redis(
        self,
        session_id: str,
        path: str,
        is_homepage: bool,
    ) -> Dict[str, Any]:
        today_key = self._today_key()
        week_key = self._week_key()
        month_key = self._month_key()
        session_key = f"portfolio:reach:session:{session_id}"
        updated_at = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
        first_seen_exists = await self._redis_pipeline([["EXISTS", "portfolio:reach:first_seen"]])

        exists_result = await self._redis_pipeline([["EXISTS", session_key]])
        is_new_session = int(exists_result[0] or 0) == 0

        commands: List[List[str]] = [
            ["INCR", "portfolio:reach:views:total"],
            ["INCR", f"portfolio:reach:views:daily:{today_key}"],
            ["INCR", f"portfolio:reach:views:weekly:{week_key}"],
            ["INCR", f"portfolio:reach:views:monthly:{month_key}"],
            ["SET", "portfolio:reach:last_updated", updated_at],
            ["SET", "portfolio:reach:last_path", path or "/"],
        ]

        if int(first_seen_exists[0] or 0) == 0:
            commands.append(["SET", "portfolio:reach:first_seen", str(int(time.time()))])

        if is_homepage:
            commands.append(["INCR", "portfolio:reach:homepage:total"])

        if is_new_session:
            commands.insert(0, ["SETEX", session_key, str(self._session_ttl_seconds), "1"])
            commands.append(["INCR", "portfolio:reach:visitors:unique"])

        await self._redis_pipeline(commands)
        return await self.get_metrics()

    async def _track_visit_file(
        self,
        session_id: str,
        path: str,
        is_homepage: bool,
        referrer: str,
        user_agent: str,
    ) -> Dict[str, Any]:
        async with self._lock:
            data = await self._load_file_data()
            data["recent_sessions"] = self._prune_sessions(data.get("recent_sessions", {}))

            is_new_session = session_id not in data["recent_sessions"]
            data["recent_sessions"][session_id] = time.time()
            data["total_views"] = int(data.get("total_views", 0)) + 1

            if is_homepage:
                data["homepage_views"] = int(data.get("homepage_views", 0)) + 1

            if is_new_session:
                data["unique_visitors"] = int(data.get("unique_visitors", 0)) + 1

            if not data.get("first_seen"):
                data["first_seen"] = int(time.time())

            today_key = self._today_key()
            week_key = self._week_key()
            month_key = self._month_key()
            data.setdefault("daily_views", {})
            data.setdefault("weekly_views", {})
            data.setdefault("monthly_views", {})
            data["daily_views"][today_key] = int(data["daily_views"].get(today_key, 0)) + 1
            data["weekly_views"][week_key] = int(data["weekly_views"].get(week_key, 0)) + 1
            data["monthly_views"][month_key] = int(data["monthly_views"].get(month_key, 0)) + 1
            data["last_updated"] = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
            data["last_path"] = path or "/"
            data["last_referrer"] = referrer or ""
            data["last_user_agent"] = user_agent[:200]

            await self._save_file_data(data)

        return await self.get_metrics()

    async def get_metrics(self) -> Dict[str, Any]:
        if self.redis_enabled:
            return await self._get_metrics_redis()
        return await self._get_metrics_file()

    async def _get_metrics_redis(self) -> Dict[str, Any]:
        today_key = self._today_key()
        week_key = self._week_key()
        month_key = self._month_key()
        results = await self._redis_pipeline(
            [
                [
                    "MGET",
                    "portfolio:reach:views:total",
                    "portfolio:reach:homepage:total",
                    "portfolio:reach:visitors:unique",
                    "portfolio:reach:last_updated",
                    "portfolio:reach:first_seen",
                ],
                ["GET", f"portfolio:reach:views:daily:{today_key}"],
                ["GET", f"portfolio:reach:views:weekly:{week_key}"],
                ["GET", f"portfolio:reach:views:monthly:{month_key}"],
            ]
        )

        totals = results[0] or [0, 0, 0, None, None]
        total_views = int(totals[0] or 0)
        first_seen = int(totals[4] or int(time.time()))
        age_days = max(1, int((time.time() - first_seen) // 86400) + 1)
        return {
            "success": True,
            "views": {
                "total": total_views,
                "homepage_total": int(totals[1] or 0),
                "unique_visitors": int(totals[2] or 0),
                "today": int(results[1] or 0),
                "this_week": int(results[2] or 0),
                "this_month": int(results[3] or 0),
            },
            "portfolio_age_days": age_days,
            "avg_views_per_day": round(total_views / max(age_days, 1), 1),
            "storage": {"backend": self.backend_name, "persistent": True},
            "timestamp": totals[3]
            or datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        }

    async def _get_metrics_file(self) -> Dict[str, Any]:
        data = await self._load_file_data()
        today_key = self._today_key()
        week_key = self._week_key()
        month_key = self._month_key()
        first_seen = int(data.get("first_seen") or int(time.time()))
        total_views = int(data.get("total_views", 0))
        age_days = max(1, int((time.time() - first_seen) // 86400) + 1)
        return {
            "success": True,
            "views": {
                "total": total_views,
                "homepage_total": int(data.get("homepage_views", 0)),
                "unique_visitors": int(data.get("unique_visitors", 0)),
                "today": int(data.get("daily_views", {}).get(today_key, 0)),
                "this_week": int(data.get("weekly_views", {}).get(week_key, 0)),
                "this_month": int(data.get("monthly_views", {}).get(month_key, 0)),
            },
            "portfolio_age_days": age_days,
            "avg_views_per_day": round(total_views / max(age_days, 1), 1),
            "storage": {"backend": self.backend_name, "persistent": False},
            "timestamp": data.get("last_updated")
            or datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        }


portfolio_analytics_store = PortfolioAnalyticsStore()

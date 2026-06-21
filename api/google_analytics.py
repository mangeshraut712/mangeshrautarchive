import json
import os
import time
from base64 import urlsafe_b64encode
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

import httpx
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.primitives.asymmetric.rsa import RSAPrivateKey
from cryptography.hazmat.primitives.serialization import load_pem_private_key


class GoogleAnalyticsDataClient:
    """Small GA4 Data API client using service-account credentials."""

    token_url = "https://oauth2.googleapis.com/token"
    api_root = "https://analyticsdata.googleapis.com/v1beta"
    scope = "https://www.googleapis.com/auth/analytics.readonly"

    def __init__(self):
        self.property_id = (
            os.getenv("GA4_PROPERTY_ID")
            or os.getenv("GOOGLE_ANALYTICS_PROPERTY_ID")
            or ""
        ).strip()
        self._credentials = self._load_credentials()
        self._token = ""
        self._token_expires_at = 0.0
        self._snapshot: Optional[Dict[str, Any]] = None
        self._snapshot_expires_at = 0.0

    @property
    def enabled(self) -> bool:
        return bool(self.property_id and self._credentials)

    @property
    def report_url(self) -> str:
        account_id = (
            os.getenv("GA4_ACCOUNT_ID")
            or os.getenv("GOOGLE_ANALYTICS_ACCOUNT_ID")
            or "394742220"
        ).strip()
        if not self.property_id:
            return ""
        return (
            "https://analytics.google.com/analytics/web/#/"
            f"a{account_id}p{self.property_id}/reports/intelligenthome"
        )

    def _load_credentials(self) -> Optional[Dict[str, str]]:
        raw_json = os.getenv("GOOGLE_ANALYTICS_SERVICE_ACCOUNT_JSON", "").strip()
        if raw_json:
            try:
                return json.loads(raw_json)
            except json.JSONDecodeError:
                return None

        credentials_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "").strip()
        if credentials_path:
            try:
                with open(credentials_path, "r", encoding="utf-8") as handle:
                    return json.load(handle)
            except (OSError, json.JSONDecodeError):
                return None

        client_email = os.getenv("GOOGLE_ANALYTICS_CLIENT_EMAIL", "").strip()
        private_key = os.getenv("GOOGLE_ANALYTICS_PRIVATE_KEY", "").strip()
        if client_email and private_key:
            return {
                "client_email": client_email,
                "private_key": private_key.replace("\\n", "\n"),
            }
        return None

    def _sign_jwt(self) -> str:
        if not self._credentials:
            raise RuntimeError("Google Analytics credentials are not configured")

        now = int(time.time())
        header = {"alg": "RS256", "typ": "JWT"}
        claims = {
            "iss": self._credentials["client_email"],
            "scope": self.scope,
            "aud": self.token_url,
            "iat": now,
            "exp": now + 3600,
        }
        encoded_header = self._base64url(json.dumps(header).encode("utf-8"))
        encoded_claims = self._base64url(json.dumps(claims).encode("utf-8"))
        signing_input = encoded_header + b"." + encoded_claims
        private_key = load_pem_private_key(
            self._credentials["private_key"].encode("utf-8"),
            password=None,
        )
        if not isinstance(private_key, RSAPrivateKey):
            raise RuntimeError("Google Analytics private key must be RSA")
        signature = private_key.sign(signing_input, padding.PKCS1v15(), hashes.SHA256())
        return (signing_input + b"." + self._base64url(signature)).decode("utf-8")

    def _base64url(self, data: bytes) -> bytes:
        return urlsafe_b64encode(data).rstrip(b"=")

    async def _access_token(self) -> str:
        now = time.time()
        if self._token and now < self._token_expires_at - 60:
            return self._token

        assertion = self._sign_jwt()
        async with httpx.AsyncClient(timeout=8.0) as client:
            response = await client.post(
                self.token_url,
                data={
                    "grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer",
                    "assertion": assertion,
                },
            )
            response.raise_for_status()
            payload = response.json()

        self._token = payload["access_token"]
        self._token_expires_at = now + int(payload.get("expires_in", 3600))
        return self._token

    async def run_report(
        self,
        *,
        start_date: str,
        end_date: str = "today",
        metrics: List[str],
        dimensions: Optional[List[str]] = None,
        limit: int = 250,
    ) -> Dict[str, Any]:
        token = await self._access_token()
        body: Dict[str, Any] = {
            "dateRanges": [{"startDate": start_date, "endDate": end_date}],
            "metrics": [{"name": metric} for metric in metrics],
            "limit": str(limit),
        }
        if dimensions:
            body["dimensions"] = [{"name": dimension} for dimension in dimensions]

        async with httpx.AsyncClient(timeout=8.0) as client:
            response = await client.post(
                f"{self.api_root}/properties/{self.property_id}:runReport",
                headers={"Authorization": f"Bearer {token}"},
                json=body,
            )
            response.raise_for_status()
            return response.json()

    def _metric_value(self, row: Dict[str, Any], index: int) -> int:
        values = row.get("metricValues", [])
        if index >= len(values):
            return 0
        try:
            return int(float(values[index].get("value", 0)))
        except (TypeError, ValueError):
            return 0

    def _dimension_value(self, row: Dict[str, Any], index: int) -> str:
        values = row.get("dimensionValues", [])
        if index >= len(values):
            return ""
        return str(values[index].get("value", "")).strip()

    async def get_reach_snapshot(self) -> Dict[str, Any]:
        if not self.enabled:
            return {}

        now = time.time()
        if self._snapshot and now < self._snapshot_expires_at:
            return self._snapshot

        total_report = await self.run_report(
            start_date="2020-01-01",
            metrics=["screenPageViews", "activeUsers", "sessions"],
            limit=1,
        )
        week_country_report = await self.run_report(
            start_date="7daysAgo",
            metrics=["activeUsers"],
            dimensions=["country"],
            limit=100,
        )
        week_totals_report = await self.run_report(
            start_date="7daysAgo",
            metrics=["activeUsers", "sessions"],
            limit=1,
        )
        daily_report = await self.run_report(
            start_date="6daysAgo",
            metrics=["screenPageViews", "activeUsers", "sessions"],
            dimensions=["date"],
            limit=10,
        )

        total_row = (total_report.get("rows") or [{}])[0]
        week_row = (week_totals_report.get("rows") or [{}])[0]
        top_countries = []
        for row in week_country_report.get("rows", []):
            users = self._metric_value(row, 0)
            if users <= 0:
                continue
            top_countries.append({"country": self._dimension_value(row, 0), "users": users})

        trend_by_date = {}
        for row in daily_report.get("rows", []):
            date_key = self._dimension_value(row, 0)
            if len(date_key) == 8:
                date_key = f"{date_key[:4]}-{date_key[4:6]}-{date_key[6:]}"
            trend_by_date[date_key] = {
                "date": date_key,
                "views": self._metric_value(row, 0),
                "visitors": self._metric_value(row, 1),
                "sessions": self._metric_value(row, 2),
            }

        today = datetime.now(timezone.utc).date()
        trend = []
        for offset in range(6, -1, -1):
            date_key = (today - timedelta(days=offset)).isoformat()
            trend.append(
                trend_by_date.get(
                    date_key,
                    {"date": date_key, "views": 0, "visitors": 0, "sessions": 0},
                )
            )

        self._snapshot = {
            "source": "google_analytics",
            "total_views": self._metric_value(total_row, 0),
            "unique_visitors": self._metric_value(total_row, 1),
            "sessions": self._metric_value(total_row, 2),
            "unique_visitors_this_week": self._metric_value(week_row, 0),
            "sessions_this_week": self._metric_value(week_row, 1),
            "countries_this_week": len(top_countries),
            "top_countries": top_countries[:5],
            "trend": trend,
            "analytics_url": self.report_url,
            "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        }
        self._snapshot_expires_at = now + 60
        return self._snapshot


google_analytics_client = GoogleAnalyticsDataClient()

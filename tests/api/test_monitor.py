"""Tests for monitor API endpoints — health, metrics, status, docs, and events."""

import os

import pytest
from fastapi.testclient import TestClient

os.environ.setdefault("VERCEL_ENV", "production")

from api.index import app


@pytest.fixture
def client():
    return TestClient(app)


class TestMonitorHealth:
    def test_health_endpoint_returns_200(self, client):
        response = client.get("/api/monitor/health")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        # "critical" is a valid runtime status under host resource pressure
        assert data["status"] in ("healthy", "degraded", "critical")
        assert "checks" in data
        assert isinstance(data["checks"], list)

    def test_health_endpoint_has_timestamp(self, client):
        response = client.get("/api/monitor/health")
        data = response.json()
        assert "timestamp" in data

    def test_health_checks_are_objects(self, client):
        response = client.get("/api/monitor/health")
        data = response.json()
        for check in data["checks"]:
            assert isinstance(check, dict)
            assert "status" in check


class TestMonitorMetrics:
    def test_metrics_endpoint_returns_200(self, client):
        response = client.get("/api/monitor/metrics")
        assert response.status_code == 200
        data = response.json()
        assert "summary" in data
        assert "uptime_seconds" in data

    def test_metrics_summary_has_counts(self, client):
        response = client.get("/api/monitor/metrics")
        data = response.json()
        summary = data["summary"]
        assert "healthy" in summary
        assert "degraded" in summary
        assert "unhealthy" in summary
        assert "total" in summary

    def test_metrics_has_endpoints(self, client):
        response = client.get("/api/monitor/metrics")
        data = response.json()
        assert "endpoints" in data
        assert isinstance(data["endpoints"], list)


class TestMonitorStatus:
    def test_status_endpoint_returns_200(self, client):
        response = client.get("/api/monitor/status")
        assert response.status_code == 200
        data = response.json()
        assert "environment" in data

    def test_status_has_runtime_info(self, client):
        response = client.get("/api/monitor/status")
        data = response.json()
        assert "runtime" in data or "version" in data


class TestMonitorDocs:
    def test_docs_endpoint_returns_200(self, client):
        response = client.get("/api/monitor/docs")
        assert response.status_code == 200
        data = response.json()
        assert "title" in data
        assert "docs_links" in data

    def test_docs_has_endpoint_groups(self, client):
        response = client.get("/api/monitor/docs")
        data = response.json()
        assert "endpoint_groups" in data
        assert isinstance(data["endpoint_groups"], list)

    def test_docs_has_status_legend(self, client):
        response = client.get("/api/monitor/docs")
        data = response.json()
        assert "status_legend" in data
        assert isinstance(data["status_legend"], list)


class TestMonitorEvents:
    def test_events_endpoint_returns_200(self, client):
        response = client.get("/api/monitor/events")
        assert response.status_code == 200
        data = response.json()
        assert "events" in data
        assert isinstance(data["events"], list)

    def test_events_respects_limit_param(self, client):
        response = client.get("/api/monitor/events?limit=5")
        data = response.json()
        assert len(data["events"]) <= 5


class TestMonitorExternalServices:
    def test_external_services_returns_200(self, client):
        response = client.get("/api/monitor/external-services")
        assert response.status_code == 200
        data = response.json()
        assert "services" in data
        assert isinstance(data["services"], list)


class TestMonitorHostingSurfaces:
    def test_hosting_surfaces_returns_200(self, client):
        response = client.get("/api/monitor/hosting-surfaces")
        assert response.status_code == 200
        data = response.json()
        assert "surfaces" in data
        assert isinstance(data["surfaces"], list)


class TestMonitorWebVitals:
    def test_web_vitals_endpoint_returns_200(self, client):
        response = client.post("/api/monitor/web-vitals", json={"LCP": 1200.0, "FID": 15.0})
        assert response.status_code == 200
        data = response.json()
        assert "status" in data or "recorded" in data


class TestMonitorPlatformHealth:
    def test_platform_health_returns_200(self, client):
        response = client.get("/api/monitor/platform-health")
        assert response.status_code == 200
        data = response.json()
        assert "checks" in data
        assert isinstance(data["checks"], list)


class TestMonitorRealTime:
    def test_real_time_returns_200(self, client):
        response = client.get("/api/monitor/real-time")
        assert response.status_code == 200
        data = response.json()
        # May be empty object if no data yet, but should be valid JSON
        assert isinstance(data, dict)


class TestMonitorSecurity:
    def test_security_endpoint_returns_200(self, client):
        response = client.get("/api/monitor/security")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, dict)


class TestMonitorAIMetrics:
    def test_ai_metrics_returns_200(self, client):
        response = client.get("/api/monitor/ai-metrics")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, dict)

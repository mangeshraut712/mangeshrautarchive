"""
Pytest unit tests for Firecrawl URL ingestion endpoint.
"""

import asyncio
import ipaddress
import socket

from fastapi.testclient import TestClient
from api.index import app
from api.integrations.firecrawl_ingest import address_is_blocked, firecrawl_service, public_dns_error

client = TestClient(app)


class _FakeResponse:
    status_code = 200

    def json(self):
        return {"data": {"markdown": "# ok"}}


def test_ingest_url_validation_error():
    response = client.post(
        "/api/ingest-url",
        json={"url": "not-a-valid-url"},
    )
    assert response.status_code == 422


def test_ingest_url_empty_validation():
    response = client.post(
        "/api/ingest-url",
        json={"url": ""},
    )
    assert response.status_code == 400


def test_ingest_url_does_not_fetch_arbitrary_urls_without_firecrawl(monkeypatch):
    monkeypatch.setattr(firecrawl_service, "is_configured", False)
    response = client.post(
        "/api/ingest-url",
        json={"url": "https://example.com/article"},
    )
    assert response.status_code == 422
    assert "Firecrawl" in response.text


def test_ingest_url_rejects_private_and_metadata_hosts():
    for url in (
        "http://169.254.169.254/latest/meta-data/",
        "http://127.0.0.1/admin",
        "http://10.1.2.3/secret",
        "http://[::1]/",
        "https://user:pass@example.com/private",
        "file:///etc/passwd",
        "http://metadata.google.internal/computeMetadata/v1/",
    ):
        response = client.post("/api/ingest-url", json={"url": url})
        assert response.status_code == 422, url  # nosec B101
        assert "Firecrawl" not in response.text  # nosec B101


def test_ingest_url_does_not_call_firecrawl_for_private_hosts(monkeypatch):
    monkeypatch.setattr(firecrawl_service, "is_configured", True)
    calls = []

    class FakeClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            return False

        async def post(self, *args, **kwargs):
            calls.append(args)
            raise AssertionError("private hosts must not be fetched")

    monkeypatch.setattr("httpx.AsyncClient", FakeClient)
    response = client.post(
        "/api/ingest-url",
        json={"url": "http://169.254.169.254/latest/meta-data/"},
    )
    assert response.status_code == 422  # nosec B101
    assert calls == []  # nosec B101


def test_address_is_blocked_unwraps_mapped_and_non_global_ranges():
    blocked = (
        "127.0.0.1",
        "10.1.2.3",
        "169.254.169.254",
        "100.64.0.1",
        "224.0.0.1",
        "::1",
        "::ffff:127.0.0.1",
        "::ffff:169.254.169.254",
        "fe80::1",
    )
    for raw in blocked:
        assert address_is_blocked(ipaddress.ip_address(raw)), raw  # nosec B101
    assert address_is_blocked(ipaddress.ip_address("::ffff:8.8.8.8")) is False  # nosec B101
    assert address_is_blocked(ipaddress.ip_address("93.184.216.34")) is False  # nosec B101


def _patch_resolution(monkeypatch, answers):
    monkeypatch.setattr(firecrawl_service, "is_configured", True)
    calls = []

    async def fake_resolve(host, port):
        calls.append((host, port))
        if isinstance(answers, BaseException):
            raise answers
        return answers

    class FakeClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            return False

        async def post(self, *args, **kwargs):
            raise AssertionError("non-public DNS answers must not be fetched")

    monkeypatch.setattr("api.integrations.firecrawl_ingest.resolve_host_addresses", fake_resolve)
    monkeypatch.setattr("httpx.AsyncClient", FakeClient)
    return calls


def test_ingest_url_rejects_dns_answers_that_are_not_public(monkeypatch):
    for answers in (
        ["127.0.0.1"],
        ["10.1.2.3"],
        ["169.254.169.254"],
        ["::1"],
        ["8.8.8.8", "10.0.0.1"],
        ["::ffff:169.254.169.254"],
        ["fe80::1%eth0"],
        ["100.64.1.1"],
        ["224.0.0.1"],
        [],
    ):
        calls = _patch_resolution(monkeypatch, answers)
        response = client.post("/api/ingest-url", json={"url": "https://rebind.example/secret"})
        assert response.status_code == 422, answers  # nosec B101
        assert "Firecrawl" not in response.text  # nosec B101
        assert calls == [("rebind.example", 443)]  # nosec B101


def test_public_dns_error_rejects_real_localhost_resolution():
    assert asyncio.run(public_dns_error("localhost", 80)) == "That host cannot be ingested."  # nosec B101


def test_ingest_url_rejects_resolution_failures(monkeypatch):
    for failure in (socket.gaierror("lookup failed"), TimeoutError()):
        calls = _patch_resolution(monkeypatch, failure)
        response = client.post("/api/ingest-url", json={"url": "http://rebind.example:8080/a"})
        assert response.status_code == 422, failure  # nosec B101
        assert calls == [("rebind.example", 8080)]  # nosec B101


def test_ingest_url_forwards_hostname_only_after_public_resolution(monkeypatch):
    monkeypatch.setattr(firecrawl_service, "is_configured", True)
    seen = {}

    async def fake_resolve(host, port):
        seen["resolved"] = (host, port)
        return ["93.184.216.34", "2606:2800:220:1:248:1893:25c8:1946"]

    class FakeClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            return False

        async def post(self, url, json=None, headers=None):
            seen["post_url"] = url
            seen["payload"] = json
            return _FakeResponse()

    monkeypatch.setattr("api.integrations.firecrawl_ingest.resolve_host_addresses", fake_resolve)
    monkeypatch.setattr("httpx.AsyncClient", FakeClient)
    response = client.post(
        "/api/ingest-url",
        json={"url": "https://example.com:8443/article"},
    )
    assert response.status_code == 200  # nosec B101
    body = response.json()
    assert body["markdown"] == "# ok"  # nosec B101
    assert body["url"] == "https://example.com:8443/article"  # nosec B101
    assert seen["resolved"] == ("example.com", 8443)  # nosec B101
    assert seen["payload"]["url"] == "https://example.com:8443/article"  # nosec B101
    assert seen["post_url"] == "https://api.firecrawl.dev/v1/scrape"  # nosec B101


def test_ingest_url_does_not_resolve_classified_literals(monkeypatch):
    monkeypatch.setattr(firecrawl_service, "is_configured", True)
    resolved = []

    async def fake_resolve(host, port):
        resolved.append((host, port))
        raise AssertionError("classified IP literals must not be resolved")

    class FakeClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            return False

        async def post(self, url, json=None, headers=None):
            resolved.append(json["url"])
            return _FakeResponse()

    monkeypatch.setattr("api.integrations.firecrawl_ingest.resolve_host_addresses", fake_resolve)
    monkeypatch.setattr("httpx.AsyncClient", FakeClient)

    blocked = client.post("/api/ingest-url", json={"url": "http://100.64.0.1/latest"})
    assert blocked.status_code == 422  # nosec B101
    multicast = client.post("/api/ingest-url", json={"url": "http://224.0.0.1/"})
    assert multicast.status_code == 422  # nosec B101
    allowed = client.post("/api/ingest-url", json={"url": "https://1.1.1.1/cdn-cgi/trace"})
    assert allowed.status_code == 200  # nosec B101
    assert resolved == ["https://1.1.1.1/cdn-cgi/trace"]  # nosec B101

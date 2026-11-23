"""Regression coverage for fail-closed local execution."""
import asyncio
import socket
import pytest
from api.local_safety import assert_local_database_environment
from api.notification_safety import reserve_notification


def test_remote_database_rejected_without_value_in_error(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "postgresql://fake:never-print@database.invalid/data")
    with pytest.raises(RuntimeError) as error:
        assert_local_database_environment()
    assert "DATABASE_URL" in str(error.value)
    assert "never-print" not in str(error.value)
    assert "database.invalid" not in str(error.value)


def test_local_database_allowed(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "postgresql://localhost/test")
    assert_local_database_environment()


def test_external_dns_blocked_before_connect():
    with pytest.raises(OSError, match="blocked external DNS"):
        socket.getaddrinfo("database.invalid", 443)


def test_local_notifications_never_contact_provider(monkeypatch):
    monkeypatch.setenv("PORTFOLIO_LOCAL_ONLY", "1")
    monkeypatch.setenv("CONTACT_NOTIFICATIONS_ENABLED", "true")
    assert asyncio.run(reserve_notification("telegram", "test-recipient", True)) is False

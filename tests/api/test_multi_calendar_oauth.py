"""Unit tests for Microsoft & Apple Calendar OAuth modules and multi-calendar availability."""

from api.integrations import apple_calendar, microsoft_calendar, sync_engine


def test_microsoft_calendar_is_configured_false_by_default(monkeypatch):
    monkeypatch.delenv("MICROSOFT_CALENDAR_CLIENT_ID", raising=False)
    monkeypatch.delenv("MICROSOFT_CALENDAR_CLIENT_SECRET", raising=False)
    assert microsoft_calendar.is_configured() is False


def test_microsoft_calendar_build_authorize_url(monkeypatch):
    monkeypatch.setenv("MICROSOFT_CALENDAR_CLIENT_ID", "test-ms-client-id")
    monkeypatch.setenv("MICROSOFT_CALENDAR_CLIENT_SECRET", "test-ms-client-secret")
    monkeypatch.setenv("MICROSOFT_CALENDAR_TENANT_ID", "common")
    url = microsoft_calendar.build_authorize_url("test_state_123")
    assert "https://login.microsoftonline.com/common/oauth2/v2.0/authorize" in url
    assert "client_id=test-ms-client-id" in url
    assert "state=test_state_123" in url
    assert "offline_access" in url


def test_apple_calendar_is_configured_false_by_default(monkeypatch):
    monkeypatch.delenv("APPLE_CALENDAR_CLIENT_ID", raising=False)
    monkeypatch.delenv("APPLE_CALENDAR_APPLE_ID", raising=False)
    monkeypatch.delenv("APPLE_CALDAV_APP_PASSWORD", raising=False)
    assert apple_calendar.is_configured() is False


def test_apple_calendar_build_authorize_url(monkeypatch):
    monkeypatch.setenv("APPLE_CALENDAR_CLIENT_ID", "pro.mangeshraut.calendar")
    url = apple_calendar.build_authorize_url("test_apple_state_456")
    assert "https://appleid.apple.com/auth/authorize" in url
    assert "client_id=pro.mangeshraut.calendar" in url
    assert "state=test_apple_state_456" in url


def test_apple_reminder_ics_builder():
    ics = apple_calendar.build_apple_reminder_ics(
        uid="rem-12345",
        title="Portfolio Consultation with Mangesh Raut",
        description="Discuss AI Agent Architecture",
        due_datetime_utc="2026-09-01T15:00:00Z",
        alarm_minutes_before=30,
    )
    assert "BEGIN:VCALENDAR" in ics
    assert "BEGIN:VTODO" in ics
    assert "UID:rem-12345" in ics
    assert "SUMMARY:Portfolio Consultation with Mangesh Raut" in ics
    assert "TRIGGER:-PT30M" in ics
    assert "END:VTODO" in ics
    assert "END:VCALENDAR" in ics


def test_merge_multi_calendar_availability():
    google_days = [
        {
            "date": "2026-09-01",
            "busy": [{"start": "2026-09-01T14:00:00Z", "end": "2026-09-01T15:00:00Z"}],
            "start": "2026-09-01T00:00:00Z",
            "end": "2026-09-02T00:00:00Z",
        }
    ]
    ms_days = [
        {
            "date": "2026-09-01",
            "busy": [{"start": "2026-09-01T16:00:00Z", "end": "2026-09-01T17:00:00Z"}],
            "start": "2026-09-01T00:00:00Z",
            "end": "2026-09-02T00:00:00Z",
        }
    ]
    apple_days = [
        {
            "date": "2026-09-01",
            "busy": [{"start": "2026-09-01T18:00:00Z", "end": "2026-09-01T19:00:00Z"}],
            "start": "2026-09-01T00:00:00Z",
            "end": "2026-09-02T00:00:00Z",
        }
    ]

    merged = sync_engine.merge_multi_calendar_availability(google_days, ms_days, apple_days)
    assert len(merged) == 1
    assert merged[0]["date"] == "2026-09-01"
    assert len(merged[0]["busy"]) == 3

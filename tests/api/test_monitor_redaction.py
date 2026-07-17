"""Public monitor output must not expose raw client IPs."""

from api.routes.monitor import _redact_monitor_event, _redact_ips_in_text


def test_redact_monitor_event_masks_top_level_and_details_ip():
    event = {
        "ip": "203.0.113.10",
        "message": "Security threat from 203.0.113.10",
        "details": {"client_ip": "198.51.100.7", "path": "/api/chat"},
    }
    redacted = _redact_monitor_event(event)
    assert redacted["ip"].startswith("client:")
    assert redacted["details"]["client_ip"].startswith("client:")
    assert "203.0.113.10" not in redacted["message"]
    assert "[redacted-ip]" in redacted["message"]


def test_redact_ips_in_text_masks_ipv4():
    assert "10.0.0.1" not in _redact_ips_in_text("seen 10.0.0.1 probing")

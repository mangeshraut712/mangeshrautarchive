"""Tests for health vitals sync helpers."""

from api.integrations.supabase_store import _merge_health_row
from api.integrations.whoop import _pick_scored_record


def test_pick_scored_record_prefers_newest_scored_entries():
    records = [
        {
            "score_state": "SCORED",
            "start": "2026-06-11T08:00:00.000Z",
            "score": {"recovery_score": 61},
        },
        {
            "score_state": "SCORED",
            "start": "2026-06-13T08:00:00.000Z",
            "score": {"recovery_score": 72},
        },
    ]
    picked = _pick_scored_record(records)
    assert picked["score"]["recovery_score"] == 72


def test_pick_scored_record_prefers_scored_entries():
    records = [
        {"score_state": "PENDING", "score": None},
        {"score_state": "SCORED", "score": {"recovery_score": 72}},
    ]
    picked = _pick_scored_record(records)
    assert picked["score"]["recovery_score"] == 72


def test_merge_health_row_preserves_existing_non_null_fields():
    existing = {
        "sleep_score": 81,
        "recovery_score": 47,
        "strain": 5.2,
        "weight_trend": "103.4 kg",
        "source_status": "synced",
    }
    incoming = {
        "date": "2026-06-13",
        "sleep_score": None,
        "recovery_score": None,
        "strain": None,
        "weight_trend": "103.8 kg · 78.2% muscle · 18.2% fat",
        "source_status": "synced",
    }
    merged = _merge_health_row(existing, incoming)
    assert merged["sleep_score"] == 81
    assert merged["recovery_score"] == 47
    assert merged["strain"] == 5.2
    assert merged["weight_trend"] == "103.8 kg · 78.2% muscle · 18.2% fat"

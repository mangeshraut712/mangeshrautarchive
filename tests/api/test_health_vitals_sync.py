"""Tests for health vitals sync helpers."""

from api.integrations.supabase_store import (
    _coalesce_latest_health_rows,
    _merge_health_row,
    _resolve_health_summary_status,
    sanitize_health_summary,
)
from api.integrations.whoop import _pick_active_cycle_record, _pick_scored_record


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


def test_pick_active_cycle_record_prefers_in_progress_cycle():
    records = [
        {
            "score_state": "SCORED",
            "start": "2026-06-10T08:00:00.000Z",
            "end": "2026-06-12T08:00:00.000Z",
            "score": {"strain": 20.7},
        },
        {
            "score_state": "SCORED",
            "start": "2026-06-21T08:00:00.000Z",
            "score": {"strain": 6.0},
        },
    ]
    picked = _pick_active_cycle_record(records)
    assert picked["score"]["strain"] == 6.0


def test_pick_scored_record_prefers_non_nap_sleep():
    records = [
        {
            "nap": True,
            "score_state": "SCORED",
            "start": "2026-07-17T14:00:00.000Z",
            "score": {"sleep_performance_percentage": 40},
        },
        {
            "nap": False,
            "score_state": "SCORED",
            "start": "2026-07-17T06:00:00.000Z",
            "score": {"sleep_performance_percentage": 85},
        },
    ]
    picked = _pick_scored_record(records, prefer_non_nap=True)
    assert picked["score"]["sleep_performance_percentage"] == 85


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


def test_resolve_health_summary_status_marks_empty_partial_rows():
    data = sanitize_health_summary(
        {
            "date": "2026-06-26",
            "sleep_score": None,
            "recovery_score": None,
            "strain": None,
            "resting_heart_rate": None,
            "hrv_trend": None,
            "weight_trend": None,
            "last_synced_at": "2026-06-26T14:31:41.959397+00:00",
            "source_status": "partial",
        }
    )
    assert _resolve_health_summary_status(data) == "partial"


def test_coalesce_latest_health_rows_keeps_recent_whoop_metrics_with_weight():
    rows = [
        {
            "date": "2026-06-28",
            "sleep_score": None,
            "recovery_score": None,
            "strain": None,
            "resting_heart_rate": None,
            "hrv_trend": None,
            "weight_trend": "102.5 kg",
            "last_synced_at": "2026-06-28T19:27:53Z",
            "source_status": "partial",
        },
        {
            "date": "2026-06-27",
            "sleep_score": 86,
            "recovery_score": 72,
            "strain": 8.4,
            "resting_heart_rate": 53,
            "hrv_trend": "stable",
            "weight_trend": None,
            "last_synced_at": "2026-06-27T13:00:00Z",
            "source_status": "synced",
        },
    ]

    merged = _coalesce_latest_health_rows(rows)

    assert merged["sleepScore"] == 86
    assert merged["recoveryScore"] == 72
    assert merged["strain"] == 8.4
    assert merged["restingHeartRate"] == 53
    assert merged["weightTrend"] == "102.5 kg"
    assert merged["sourceStatus"] == "synced"

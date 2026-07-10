"""Tests for Withings body composition parsing."""

from api.integrations.withings import (
    _MEASURE_FAT_RATIO_PCT,
    _MEASURE_FAT_MASS_KG,
    _MEASURE_MUSCLE_MASS_KG,
    _MEASURE_WEIGHT_KG,
    _latest_body_comp_measures,
    _resolve_fat_ratio_pct,
    _resolve_muscle_ratio_pct,
    format_weight_trend,
)


def test_format_weight_trend_uses_fat_ratio_not_heart_pulse():
    groups = [
        {
            "date": 1718200000,
            "measures": [
                {"type": _MEASURE_WEIGHT_KG, "value": 10380, "unit": -2},
                {"type": 11, "value": 93, "unit": 0},
                {"type": _MEASURE_FAT_RATIO_PCT, "value": 182, "unit": -1},
                {"type": _MEASURE_MUSCLE_MASS_KG, "value": 8120, "unit": -2},
            ],
        }
    ]
    measures = _latest_body_comp_measures(groups)
    trend = format_weight_trend(measures)
    assert trend == "103.8 kg · 78.2% muscle · 18.2% fat"


def test_latest_body_comp_measures_prefers_newest_weigh_in():
    groups = [
        {
            "date": 1718100000,
            "measures": [{"type": _MEASURE_WEIGHT_KG, "value": 9000, "unit": -2}],
        },
        {
            "date": 1718200000,
            "measures": [
                {"type": _MEASURE_WEIGHT_KG, "value": 10380, "unit": -2},
                {"type": _MEASURE_FAT_RATIO_PCT, "value": 200, "unit": -1},
            ],
        },
    ]
    measures = _latest_body_comp_measures(groups)
    assert measures[_MEASURE_WEIGHT_KG] == 103.8
    assert _resolve_fat_ratio_pct(measures) == 20.0


def test_fat_ratio_derived_from_fat_mass_when_ratio_missing():
    measures = {
        _MEASURE_WEIGHT_KG: 100.0,
        _MEASURE_FAT_MASS_KG: 22.0,
    }
    assert _resolve_fat_ratio_pct(measures) == 22.0


def test_muscle_ratio_derived_from_muscle_mass():
    measures = {
        _MEASURE_WEIGHT_KG: 103.8,
        _MEASURE_MUSCLE_MASS_KG: 81.2,
    }
    assert _resolve_muscle_ratio_pct(measures) == 78.2

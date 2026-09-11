from datetime import datetime, timezone

import pytest

from app.engine import (
    check_sustained_decline,
    detect_trend,
    estimate_ability,
    generate_explanation,
    select_difficulty,
)


def dt(y: int, m: int, d: int) -> datetime:
    return datetime(y, m, d, tzinfo=timezone.utc)


class TestEstimateAbility:
    def test_baseline_for_empty_attempts(self):
        result = estimate_ability([])
        assert 0 <= result <= 1

    def test_higher_ability_for_correct(self):
        attempts = [
            {"correct": True, "responseTimeMs": 1000, "difficulty": "MEDIUM"}
        ] * 10
        assert estimate_ability(attempts) > 0.5

    def test_lower_ability_for_incorrect(self):
        attempts = [
            {"correct": False, "responseTimeMs": 3000, "difficulty": "EASY"}
        ] * 10
        assert estimate_ability(attempts) < 0.5

    def test_harder_difficulties_weight_more(self):
        easy = [
            {"correct": True, "responseTimeMs": 1000, "difficulty": "EASY"}
        ] * 5
        hard = [
            {"correct": True, "responseTimeMs": 1000, "difficulty": "HARD"}
        ] * 5
        assert estimate_ability(hard) > estimate_ability(easy)


class TestSelectDifficulty:
    def test_hard_for_high_ability(self):
        assert select_difficulty(0.85, []) == "HARD"

    def test_easy_for_low_ability(self):
        assert select_difficulty(0.2, []) == "EASY"

    def test_medium_for_medium_ability(self):
        assert select_difficulty(0.6, []) == "MEDIUM"

    def test_reduce_after_consecutive_failures(self):
        assert select_difficulty(0.7, [{"correct": False}, {"correct": False}]) == "EASY"

    def test_no_reduce_for_single_failure_at_high_ability(self):
        assert select_difficulty(0.85, [{"correct": False}]) == "HARD"


class TestDetectTrend:
    def test_null_for_insufficient_data(self):
        assert detect_trend([{"abilityEstimate": 0.5, "createdAt": dt(2024, 1, 1)}]) is None

    def test_improving(self):
        data = [
            {"abilityEstimate": 0.3, "createdAt": dt(2024, 1, 1)},
            {"abilityEstimate": 0.5, "createdAt": dt(2024, 1, 8)},
            {"abilityEstimate": 0.7, "createdAt": dt(2024, 1, 15)},
            {"abilityEstimate": 0.9, "createdAt": dt(2024, 1, 22)},
        ]
        assert detect_trend(data) == "IMPROVING"

    def test_declining(self):
        data = [
            {"abilityEstimate": 0.9, "createdAt": dt(2024, 1, 1)},
            {"abilityEstimate": 0.7, "createdAt": dt(2024, 1, 8)},
            {"abilityEstimate": 0.5, "createdAt": dt(2024, 1, 15)},
            {"abilityEstimate": 0.3, "createdAt": dt(2024, 1, 22)},
        ]
        assert detect_trend(data) == "DECLINING"

    def test_stable(self):
        data = [
            {"abilityEstimate": 0.6, "createdAt": dt(2024, 1, 1)},
            {"abilityEstimate": 0.58, "createdAt": dt(2024, 1, 8)},
            {"abilityEstimate": 0.62, "createdAt": dt(2024, 1, 15)},
            {"abilityEstimate": 0.59, "createdAt": dt(2024, 1, 22)},
        ]
        assert detect_trend(data) == "STABLE"


class TestCheckSustainedDecline:
    def test_false_for_insufficient_data(self):
        result = check_sustained_decline(
            [{"abilityEstimate": 0.5, "cognitiveDomain": "OBJECT_MATCH"}]
        )
        assert result is False

    def test_true_for_3_plus_consecutive_same_domain(self):
        result = check_sustained_decline(
            [
                {"abilityEstimate": 0.8, "cognitiveDomain": "OBJECT_MATCH"},
                {"abilityEstimate": 0.7, "cognitiveDomain": "OBJECT_MATCH"},
                {"abilityEstimate": 0.6, "cognitiveDomain": "OBJECT_MATCH"},
                {"abilityEstimate": 0.5, "cognitiveDomain": "OBJECT_MATCH"},
            ]
        )
        assert result is True

    def test_false_when_decline_broken(self):
        result = check_sustained_decline(
            [
                {"abilityEstimate": 0.8, "cognitiveDomain": "OBJECT_MATCH"},
                {"abilityEstimate": 0.7, "cognitiveDomain": "OBJECT_MATCH"},
                {"abilityEstimate": 0.75, "cognitiveDomain": "OBJECT_MATCH"},
                {"abilityEstimate": 0.6, "cognitiveDomain": "OBJECT_MATCH"},
            ]
        )
        assert result is False

    def test_does_not_cross_domain_boundaries(self):
        result = check_sustained_decline(
            [
                {"abilityEstimate": 0.8, "cognitiveDomain": "OBJECT_MATCH"},
                {"abilityEstimate": 0.7, "cognitiveDomain": "PATTERN_RECALL"},
                {"abilityEstimate": 0.6, "cognitiveDomain": "OBJECT_MATCH"},
                {"abilityEstimate": 0.5, "cognitiveDomain": "PATTERN_RECALL"},
            ]
        )
        assert result is False


class TestGenerateExplanation:
    def test_improving_trend(self):
        result = generate_explanation("OBJECT_MATCH", 0.75, "IMPROVING")
        assert "object match" in result.lower()
        assert "dementia" not in result.lower()
        assert "diagnosis" not in result.lower()

    def test_no_dementia_or_diagnosis(self):
        domains = ["OBJECT_MATCH", "PATTERN_RECALL", "WHO_IS_CALLING"]
        trends = ["IMPROVING", "STABLE", "DECLINING"]
        for d in domains:
            for t in trends:
                result = generate_explanation(d, 0.6, t)
                assert "dementia" not in result.lower()
                assert "diagnos" not in result.lower()

    def test_includes_ability_percentage(self):
        result = generate_explanation("OBJECT_MATCH", 0.75, "STABLE")
        assert "75%" in result

    def test_handles_null_trend(self):
        result = generate_explanation("OBJECT_MATCH", 0.5, None)
        assert "50%" in result
        assert "monitored" in result.lower()
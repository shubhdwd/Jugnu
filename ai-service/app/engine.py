"""Jugnu AI engine - pure recommendation logic.

A faithful port of the TypeScript heuristics in
backend/src/services/ai.service.ts so the adaptive engine can run either
as an in-process TS fallback or as a remote Python AI/ML service
(see Jugnu_Complete_Backend_Architecture.pdf, section 23).
"""

import math
import re
from typing import Iterable, Optional, TypedDict

DIFFICULTY_WEIGHTS = {
    "EASY": 0.2,
    "MEDIUM": 0.5,
    "HARD": 0.8,
    "ADAPTIVE": 0.5,
}


class Attempt(TypedDict):
    correct: bool
    responseTimeMs: Optional[float]
    difficulty: str


class Insight(TypedDict):
    abilityEstimate: float
    createdAt: object
    cognitiveDomain: Optional[str]


def _math_round(value: float) -> int:
    """Match JavaScript Math.round (round half up)."""
    if value >= 0:
        return math.floor(value + 0.5)
    return math.ceil(value - 0.5)


def estimate_ability(attempts: Iterable[Attempt]) -> float:
    """Estimate cognitive ability in [0, 1] from a sequence of attempts."""
    attempts = list(attempts)
    if not attempts:
        return 0.5

    ability = 0.5
    decay_factor = 0.85
    n = len(attempts)

    for i, attempt in enumerate(attempts):
        difficulty_weight = DIFFICULTY_WEIGHTS.get(attempt["difficulty"], 0.5)
        recency_weight = decay_factor ** (n - 1 - i)
        correctness = 1 if attempt["correct"] else 0

        expected_score = ability * difficulty_weight
        actual_score = correctness * difficulty_weight
        delta = (actual_score - expected_score) * recency_weight * 0.3

        ability += delta

    return max(0.0, min(1.0, ability))


def select_difficulty(
    ability_estimate: float,
    recent_attempts: Iterable[dict],
) -> str:
    """Pick the next game difficulty targeting ~70-80% success."""
    recent = list(recent_attempts)
    last_two = recent[-2:]
    both_failed = (
        len(last_two) == 2
        and all(not bool(a.get("correct")) for a in last_two)
    )

    if both_failed:
        return "EASY"

    if ability_estimate > 0.8:
        return "HARD"
    if ability_estimate > 0.5:
        return "MEDIUM"
    if ability_estimate <= 0.3:
        return "EASY"
    return "ADAPTIVE"


def detect_trend(insights: Iterable[Insight]) -> Optional[str]:
    """Linear-regression slope over recent insights -> IMProving/STABLE/DECLINING."""
    insights = list(insights)
    if len(insights) < 3:
        return None

    sorted_insights = sorted(
        insights, key=lambda i: i["createdAt"].timestamp()
    )

    n = len(sorted_insights)
    sum_x = 0.0
    sum_y = 0.0
    sum_xy = 0.0
    sum_x2 = 0.0

    for i, insight in enumerate(sorted_insights):
        x = i
        y = insight["abilityEstimate"]
        sum_x += x
        sum_y += y
        sum_xy += x * y
        sum_x2 += x * x

    denominator = n * sum_x2 - sum_x * sum_x
    if denominator == 0:
        return "STABLE"

    slope = (n * sum_xy - sum_x * sum_y) / denominator

    if slope > 0.05:
        return "IMPROVING"
    if slope < -0.05:
        return "DECLINING"
    return "STABLE"


def check_sustained_decline(insights: Iterable[Insight]) -> bool:
    """True when a single cognitive domain shows 3+ consecutive declines."""
    by_domain: dict[str, list] = {}
    for insight in insights:
        domain = insight.get("cognitiveDomain") or "UNKNOWN"
        by_domain.setdefault(domain, []).append(insight)

    for domain_insights in by_domain.values():
        ordered = list(domain_insights)
        if len(ordered) < 3:
            continue

        consecutive_declines = 0
        for i in range(1, len(ordered)):
            if ordered[i]["abilityEstimate"] < ordered[i - 1]["abilityEstimate"]:
                consecutive_declines += 1
            else:
                consecutive_declines = 0

        if consecutive_declines >= 3:
            return True

    return False


def generate_explanation(
    cognitive_domain: str,
    ability_estimate: float,
    trend: Optional[str],
) -> str:
    """Human-readable explanation (never a medical diagnosis)."""
    domain_name = re.sub(
        r"\b\w",
        lambda m: m.group(0).upper(),
        cognitive_domain.replace("_", " ").lower(),
    )

    if trend == "IMPROVING":
        trend_phrase = "has been improving over recent sessions"
    elif trend == "DECLINING":
        trend_phrase = "has been declining over recent sessions"
    elif trend == "STABLE":
        trend_phrase = "has remained relatively stable"
    else:
        trend_phrase = "is being monitored"

    ability_percent = _math_round(ability_estimate * 100)

    return (
        f"{domain_name} ability {trend_phrase}."
        f" Current estimated ability: {ability_percent}%."
    )
from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import ai_engine

app = FastAPI(title="Jugnu Adaptive Care AI")


@app.get("/health")
def health():
    return {"status": "ok", "service": "jugnu-aiml"}


# ---------- Individual endpoints (called by Node backend) ----------

class Attempt(BaseModel):
    correct: bool
    responseTimeMs: Optional[float] = None
    difficulty: str

class AbilityRequest(BaseModel):
    attempts: List[Attempt] = []

class DifficultyRequest(BaseModel):
    abilityEstimate: float
    recentAttempts: List[dict] = []

class InsightPoint(BaseModel):
    abilityEstimate: float
    createdAt: datetime

class TrendRequest(BaseModel):
    insights: List[InsightPoint] = []

class DeclinePoint(BaseModel):
    abilityEstimate: float
    cognitiveDomain: str

class DeclineRequest(BaseModel):
    insights: List[DeclinePoint] = []

class ExplainRequest(BaseModel):
    cognitiveDomain: str
    abilityEstimate: float
    trend: Optional[str] = None


@app.post("/ability")
def ability(req: AbilityRequest):
    total = len(req.attempts)
    if total == 0:
        return {"abilityEstimate": 0.5}
    correct_count = sum(1 for a in req.attempts if a.correct)
    accuracy = correct_count / total
    avg_time = 5000.0
    times = [a.responseTimeMs for a in req.attempts if a.responseTimeMs is not None]
    if times:
        avg_time = sum(times) / len(times)
    result = ai_engine.calculate_ability(accuracy, avg_time / 1000.0, 5.0, None)
    return {"abilityEstimate": round(result / 100, 2)}


@app.post("/difficulty")
def difficulty(req: DifficultyRequest):
    consecutive_failures = 0
    for a in reversed(req.recentAttempts):
        if not a.get("correct"):
            consecutive_failures += 1
        else:
            break
    ability_scaled = req.abilityEstimate * 100
    diff, _ = ai_engine.adapt_difficulty(ability_scaled, 3, consecutive_failures)
    diff_map = {1: "EASY", 2: "MEDIUM", 3: "MEDIUM", 4: "HARD", 5: "HARD"}
    return {"difficulty": diff_map.get(diff, "ADAPTIVE")}


@app.post("/trend")
def trend(req: TrendRequest):
    if len(req.insights) < 3:
        return {"trend": None}
    scores = [i.abilityEstimate * 100 for i in req.insights]
    baseline = scores[0]
    recent_avg = sum(scores[-3:]) / 3
    drop = baseline - recent_avg
    if drop > 5:
        return {"trend": "DECLINING"}
    if drop < -5:
        return {"trend": "IMPROVING"}
    return {"trend": "STABLE"}


@app.post("/decline")
def decline(req: DeclineRequest):
    if not req.insights:
        return {"sustainedDecline": False}
    by_domain = {}
    for i in req.insights:
        by_domain.setdefault(i.cognitiveDomain, []).append(i.abilityEstimate)
    for domain, estimates in by_domain.items():
        if len(estimates) < 3:
            continue
        consecutive = 0
        for j in range(1, len(estimates)):
            if estimates[j] < estimates[j - 1]:
                consecutive += 1
            else:
                consecutive = 0
        if consecutive >= 3:
            return {"sustainedDecline": True}
    return {"sustainedDecline": False}


@app.post("/explain")
def explain(req: ExplainRequest):
    domain_name = req.cognitiveDomain.replace("_", " ").title()
    ability_pct = round(req.abilityEstimate * 100)
    trend_text = "is being monitored"
    if req.trend == "IMPROVING":
        trend_text = "has been improving over recent sessions"
    elif req.trend == "DECLINING":
        trend_text = "has been declining over recent sessions"
    elif req.trend == "STABLE":
        trend_text = "has remained relatively stable"
    return {"explanation": f"{domain_name} ability {trend_text}. Current estimated ability: {ability_pct}%."}

class SessionData(BaseModel):
    accuracy: float
    response_time: float
    expected_time: float
    current_difficulty: int
    prev_ability: Optional[float] = None
    consecutive_failures: int
    baseline_ability: Optional[float] = None
    recent_scores: List[float] = []
    
    # New fields for the final tasks
    recent_moods: List[str] = []
    preferred_category: str = "general"

@app.post("/analyze-session")
def analyze_session(data: SessionData):
    # 1. Ability & Difficulty (Completed)
    new_ability = ai_engine.calculate_ability(
        data.accuracy, data.response_time, data.expected_time, data.prev_ability
    )
    next_diff, explanation = ai_engine.adapt_difficulty(
        new_ability, data.current_difficulty, data.consecutive_failures
    )
    
    # 2. Trend Detection (Completed)
    updated_recent_scores = data.recent_scores + [new_ability]
    decline_flag, decline_msg = ai_engine.detect_decline(
        data.baseline_ability, updated_recent_scores
    )

    # 3. Personalised Content (New)
    content_instruction = ai_engine.select_content(next_diff, data.preferred_category)

    # 4. Caregiver Mood Alert (New)
    mood_alert_flag, mood_msg = ai_engine.check_mood_alert(data.recent_moods)

    return {
        "calculated_ability": round(new_ability, 2),
        "next_difficulty": next_diff,
        "explanation": explanation,
        "decline_alert": decline_flag,
        "decline_message": decline_msg,
        "content_selection": content_instruction,
        "mood_alert": mood_alert_flag,
        "mood_message": mood_msg
    }

# Dedicated route for establishing the baseline once 5 sessions are hit
class BaselineData(BaseModel):
    initial_scores: List[float]

@app.post("/establish-baseline")
def get_baseline(data: BaselineData):
    baseline, message = ai_engine.establish_baseline(data.initial_scores)
    return {
        "calculated_baseline": baseline,
        "status": message
    }

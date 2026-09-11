"""Jugnu AI Service - FastAPI entry point.

Implements the Python AI/ML service described in Jugnu_Complete_Backend_Architecture.pdf.
Node/Express (backend) calls this service for ability estimation, adaptive
difficulty, trend analysis and explanation generation (section 23).
"""

from datetime import datetime
from typing import List, Optional

from fastapi import FastAPI
from pydantic import BaseModel, Field

from .engine import (
    check_sustained_decline,
    detect_trend,
    estimate_ability,
    generate_explanation,
    select_difficulty,
)

app = FastAPI(
    title="Jugnu AI Service",
    description="Adaptive cognitive gaming engine: ability estimation, adaptive difficulty, trend analysis.",
    version="1.0.0",
)


class Attempt(BaseModel):
    correct: bool
    responseTimeMs: Optional[float] = None
    difficulty: str = Field(..., pattern="^(EASY|MEDIUM|HARD|ADAPTIVE)$")


class AbilityRequest(BaseModel):
    attempts: List[Attempt] = []


class RecentAttempt(BaseModel):
    correct: bool


class DifficultyRequest(BaseModel):
    abilityEstimate: float = Field(..., ge=0, le=1)
    recentAttempts: List[RecentAttempt] = []


class InsightPoint(BaseModel):
    abilityEstimate: float = Field(..., ge=0, le=1)
    createdAt: datetime


class TrendRequest(BaseModel):
    insights: List[InsightPoint] = []


class DeclinePoint(BaseModel):
    abilityEstimate: float = Field(..., ge=0, le=1)
    cognitiveDomain: str


class DeclineRequest(BaseModel):
    insights: List[DeclinePoint] = []


class AnalysisInsightPoint(BaseModel):
    abilityEstimate: float = Field(..., ge=0, le=1)
    createdAt: datetime
    cognitiveDomain: str


class AnalyzeRequest(BaseModel):
    cognitiveDomain: str
    attempts: List[Attempt] = []
    insights: List[AnalysisInsightPoint] = []


class ExplainRequest(BaseModel):
    cognitiveDomain: str
    abilityEstimate: float = Field(..., ge=0, le=1)
    trend: Optional[str] = Field(None, pattern="^(IMPROVING|STABLE|DECLINING)$")


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str


@app.get("/health", response_model=HealthResponse, tags=["system"])
def health() -> HealthResponse:
    return HealthResponse(status="ok", service="jugnu-ai", version="1.0.0")


@app.post("/ability", tags=["ai"])
def ability(req: AbilityRequest) -> dict:
    return {
        "abilityEstimate": estimate_ability(
            [a.model_dump() for a in req.attempts]
        )
    }


@app.post("/difficulty", tags=["ai"])
def difficulty(req: DifficultyRequest) -> dict:
    return {
        "difficulty": select_difficulty(
            req.abilityEstimate,
            [a.model_dump() for a in req.recentAttempts],
        )
    }


@app.post("/trend", tags=["ai"])
def trend(req: TrendRequest) -> dict:
    return {
        "trend": detect_trend(
            [i.model_dump() for i in req.insights]
        )
    }


@app.post("/decline", tags=["ai"])
def decline(req: DeclineRequest) -> dict:
    return {
        "sustainedDecline": check_sustained_decline(
            [i.model_dump() for i in req.insights]
        )
    }


@app.post("/explain", tags=["ai"])
def explain(req: ExplainRequest) -> dict:
    return {
        "explanation": generate_explanation(
            req.cognitiveDomain,
            req.abilityEstimate,
            req.trend,
        )
    }


@app.post("/analyze-session", tags=["ai"])
def analyze_session(req: AnalyzeRequest) -> dict:
    ability = estimate_ability([a.model_dump() for a in req.attempts])

    insight_data = [
        {
            "abilityEstimate": i.abilityEstimate,
            "createdAt": i.createdAt,
            "cognitiveDomain": i.cognitiveDomain,
        }
        for i in req.insights
    ]
    trend_value = detect_trend(
        [
            {"abilityEstimate": i["abilityEstimate"], "createdAt": i["createdAt"]}
            for i in insight_data
        ]
    )
    sustained = check_sustained_decline(insight_data)

    explanation = generate_explanation(
        req.cognitiveDomain,
        ability,
        trend_value,
    )

    return {
        "abilityEstimate": ability,
        "trend": trend_value,
        "sustainedDecline": sustained,
        "explanation": explanation,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
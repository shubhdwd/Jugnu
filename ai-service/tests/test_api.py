from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


class TestHealth:
    def test_health(self):
        res = client.get("/health")
        assert res.status_code == 200
        body = res.json()
        assert body["status"] == "ok"
        assert body["service"] == "jugnu-ai"


class TestAbility:
    def test_ability_higher_for_correct(self):
        res = client.post("/ability", json={
            "attempts": [
                {"correct": True, "responseTimeMs": 1000, "difficulty": "MEDIUM"},
                {"correct": True, "responseTimeMs": 1000, "difficulty": "MEDIUM"},
            ]
        })
        assert res.status_code == 200
        assert 0 <= res.json()["abilityEstimate"] <= 1

    def test_invalid_difficulty_rejected(self):
        res = client.post("/ability", json={
            "attempts": [{"correct": True, "difficulty": "NIGHTMARE"}]
        })
        assert res.status_code == 422


class TestDifficulty:
    def test_hard_for_high_ability(self):
        res = client.post("/difficulty", json={
            "abilityEstimate": 0.85,
            "recentAttempts": [],
        })
        assert res.status_code == 200
        assert res.json()["difficulty"] == "HARD"


class TestTrend:
    def test_null_for_insufficient(self):
        res = client.post("/trend", json={
            "insights": [{"abilityEstimate": 0.5, "createdAt": "2024-01-01T00:00:00Z"}]
        })
        assert res.status_code == 200
        assert res.json()["trend"] is None


class TestDecline:
    def test_sustained_decline_detected(self):
        res = client.post("/decline", json={
            "insights": [
                {"abilityEstimate": 0.8, "cognitiveDomain": "OBJECT_MATCH"},
                {"abilityEstimate": 0.7, "cognitiveDomain": "OBJECT_MATCH"},
                {"abilityEstimate": 0.6, "cognitiveDomain": "OBJECT_MATCH"},
                {"abilityEstimate": 0.5, "cognitiveDomain": "OBJECT_MATCH"},
            ]
        })
        assert res.status_code == 200
        assert res.json()["sustainedDecline"] is True


class TestExplain:
    def test_explanation(self):
        res = client.post("/explain", json={
            "cognitiveDomain": "OBJECT_MATCH",
            "abilityEstimate": 0.75,
            "trend": "IMPROVING",
        })
        assert res.status_code == 200
        assert "75%" in res.json()["explanation"]


class TestAnalyzeSession:
    def test_full_analysis(self):
        res = client.post("/analyze-session", json={
            "cognitiveDomain": "OBJECT_MATCH",
            "attempts": [
                {"correct": True, "responseTimeMs": 1000, "difficulty": "MEDIUM"},
                {"correct": True, "responseTimeMs": 1000, "difficulty": "MEDIUM"},
            ],
            "insights": [
                {"abilityEstimate": 0.5, "createdAt": "2024-01-01T00:00:00Z", "cognitiveDomain": "OBJECT_MATCH"},
                {"abilityEstimate": 0.6, "createdAt": "2024-01-08T00:00:00Z", "cognitiveDomain": "OBJECT_MATCH"},
            ],
        })
        assert res.status_code == 200
        body = res.json()
        assert "abilityEstimate" in body
        assert "trend" in body
        assert "sustainedDecline" in body
        assert "explanation" in body
        assert 0 <= body["abilityEstimate"] <= 1
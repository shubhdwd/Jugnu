import ai_engine

print("--- 1. Testing Ability Estimation ---")
# Scenario: 90% accuracy, 4s time (expected 5s), previous ability was 75
new_ability = ai_engine.calculate_ability(
    accuracy=0.90, 
    response_time=4.0, 
    expected_time=5.0, 
    prev_ability=75.0
)
print(f"New Ability Score: {new_ability:.2f}")

print("\n--- 2. Testing Adaptive Difficulty ---")
# Scenario A: High ability, no failures
diff_up, msg_up = ai_engine.adapt_difficulty(ability=85, current_diff=2, consecutive_failures=0)
print(f"Scenario A (High Score): Level {diff_up} | {msg_up}")

# Scenario B: Frustration check (3 failures overrides ability)
diff_fail, msg_fail = ai_engine.adapt_difficulty(ability=75, current_diff=3, consecutive_failures=3)
print(f"Scenario B (Frustrated): Level {diff_fail} | {msg_fail}")

print("\n--- 3. Testing Trend / Decline Detection ---")
baseline = 85.0

# Test A: Stable patient
stable_scores = [84.0, 86.0, 83.0]
is_alert, alert_msg = ai_engine.detect_decline(baseline, stable_scores)
print(f"Stable Patient: Alert={is_alert} | {alert_msg}")

# Test B: Declining patient
declining_scores = [76.0, 74.0, 72.0] # Average is 74. Drop is 11 points.
is_alert, alert_msg = ai_engine.detect_decline(baseline, declining_scores)
print(f"Declining Patient: Alert={is_alert} | {alert_msg}")

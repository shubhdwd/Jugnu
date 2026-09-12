import numpy as np

def calculate_ability(accuracy, response_time, expected_time, prev_ability):
    # 1. Protection against bad data
    safe_time = max(0.1, response_time) 
    
    # 2. Calculate raw scores
    accuracy_score = accuracy * 100
    speed_score = max(0, min(100, (expected_time / safe_time) * 100))
    
    # 3. Combine them (70% accuracy, 30% speed)
    current_performance = (0.7 * accuracy_score) + (0.3 * speed_score)
    
    # 4. Smooth the score with historical data
    if prev_ability is not None and prev_ability > 0:
        return (0.7 * prev_ability) + (0.3 * current_performance)
    
    return current_performance

def adapt_difficulty(ability, current_diff, consecutive_failures):
    # 1. Frustration check (Highest priority)
    if consecutive_failures >= 3:
        return max(current_diff - 1, 1), "Reduced due to 3 consecutive failures."
    
    # 2. Performance checks
    if ability >= 80:
        return min(current_diff + 1, 5), "Increased due to high performance."
    if ability < 70:
        return max(current_diff - 1, 1), "Reduced to match current ability."
    
    return current_diff, "Maintained to keep 70-80% success target."

def detect_decline(baseline_ability, recent_scores, threshold=8.0):
    # 1. Safeguard: Check if we have enough data to make a clinical judgment
    if baseline_ability is None:
        return False, "No baseline established yet."
        
    if len(recent_scores) < 3:
        return False, "Gathering data. Need at least 3 recent sessions."
        
    # 2. Calculate the rolling average of the most recent 3 sessions
    recent_average = np.mean(recent_scores[-3:])
    
    # 3. Calculate the difference from their personal normal
    drop = baseline_ability - recent_average
    
    # 4. Trigger the alert if the drop exceeds the threshold
    if drop >= threshold:
        return True, f"Alert: Sustained decline of {drop:.1f} points detected."
        
    return False, f"Performance is stable (Current drop: {drop:.1f})."

# Add this below your existing detect_decline function

def establish_baseline(initial_scores):
    # Requirement: Establishes normal performance from initial sessions
    if len(initial_scores) < 5:
        return None, f"Need 5 sessions to establish baseline. Currently have {len(initial_scores)}."
    
    baseline = sum(initial_scores[:5]) / 5
    return round(baseline, 2), "Baseline established."

def check_mood_alert(recent_moods):
    # Requirement: 3 consecutive 😞 → support alert
    if len(recent_moods) >= 3 and all(mood == "😞" for mood in recent_moods[-3:]):
        return True, "Alert: Caregiver support needed. Patient reported low mood 3 consecutive times."
    return False, "Mood stable."

import random

# 1. Create a mock content library for the MVP
CONTENT_LIBRARY = [
    # Level 1 — GENERIC (generic content, zero setup)
    {"content_id": "c1", "category": "family", "level": 1, "type": "photo", "url": "/assets/generic_family.jpg"},
    {"content_id": "m1", "category": "music", "level": 1, "type": "audio", "url": "/assets/generic_music.mp3"},
    {"content_id": "d1", "category": "daily_life", "level": 1, "type": "photo", "url": "/assets/generic_daily.jpg"},
    
    # Level 2 — FULL (real photos, family voices, personalized)
    {"content_id": "c2", "category": "family", "level": 2, "type": "photo", "url": "/assets/personal_family.jpg"},
    {"content_id": "m2", "category": "music", "level": 2, "type": "audio", "url": "/assets/personal_music.mp3"},
    {"content_id": "d2", "category": "daily_life", "level": 2, "type": "photo", "url": "/assets/personal_daily.jpg"},
]

def select_content(difficulty_level, preferred_category):
    # Step 1: Try to find an EXACT match (Correct category + Correct level)
    suitable_content = [
        item for item in CONTENT_LIBRARY 
        if item["category"].lower() == preferred_category.lower() 
        and item["level"] == difficulty_level
    ]
    
    # Step 2: Fallback logic - If level doesn't match, give them any content in the same category
    if not suitable_content:
        suitable_content = [
            item for item in CONTENT_LIBRARY 
            if item["category"].lower() == preferred_category.lower()
        ]
    
    # Step 3: Ultimate fallback - If they chose a category that doesn't exist, 
    # just give them anything that matches their difficulty level.
    if not suitable_content:
        suitable_content = [item for item in CONTENT_LIBRARY if item["level"] == difficulty_level]
        
    # Step 4: If the library is completely broken/empty, return a safe default
    if not suitable_content:
        return {"error": "No content found", "fallback_url": "/assets/default.jpg"}
        
    # Step 5: Randomly pick one item from the filtered list so the patient doesn't see the exact same photo every time
    selected_item = random.choice(suitable_content)
    
    return selected_item

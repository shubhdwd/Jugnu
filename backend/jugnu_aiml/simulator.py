import numpy as np
import json

def generate_patient_data(profile_type, num_sessions=5):
    sessions = []
    
    for i in range(num_sessions):
        # Base logic for different patient profiles
        if profile_type == "stable":
            # Consistently scores around 85%
            accuracy = np.random.normal(0.85, 0.05)
            response_time = np.random.normal(4.5, 0.5)
            
        elif profile_type == "improving":
            # Starts at 60%, improves by 5% each session
            accuracy = min(1.0, np.random.normal(0.60 + (i * 0.05), 0.05))
            response_time = max(3.0, np.random.normal(6.0 - (i * 0.4), 0.5))
            
        elif profile_type == "declining":
            # Starts high, drops by 6% each session (Triggers your alert)
            accuracy = max(0.0, np.random.normal(0.90 - (i * 0.06), 0.05))
            response_time = np.random.normal(4.0 + (i * 0.5), 0.5)
            
        else: # Fluctuating / Struggling
            accuracy = np.random.normal(0.55, 0.15)
            response_time = np.random.normal(7.0, 1.5)

        # Ensure realistic boundaries
        accuracy = round(max(0.0, min(1.0, accuracy)), 2)
        response_time = round(max(1.0, response_time), 1)

        sessions.append({
            "session_number": i + 1,
            "accuracy": accuracy,
            "response_time": response_time,
            "expected_time": 5.0,
            "current_difficulty": 3
        })
        
    return sessions

# Generate and print a declining patient to test the alert system
print("--- Generating Declining Patient Data ---")
declining_patient = generate_patient_data("declining", num_sessions=5)
print(json.dumps(declining_patient, indent=2))

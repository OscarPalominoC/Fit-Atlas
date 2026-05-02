from typing import List
from app.models import CompletedExercise

def calculate_difficulty(
    duration_seconds: int,
    completed_exercises: List[CompletedExercise],
    routine_difficulty: int
) -> float:
    """
    difficultyScore = 
    (volume*0.30) + (intensity*0.30) + (density*0.20) + (rest*0.10) + (complexity*0.10)
    """
    
    total_volume = sum(ex.sets_completed * sum(ex.reps) * ex.weight for ex in completed_exercises)
    
    # Normalization factors (placeholders, would be tuned based on user history)
    # For now, let's assume a "standard" high volume session is 10,000kg
    norm_volume = min(total_volume / 10000, 1.0) * 100
    
    # Intensity based on routine baseline difficulty (1-5 -> 0-100)
    norm_intensity = (routine_difficulty / 5) * 100
    
    # Density: Volume per minute
    volume_per_minute = total_volume / (duration_seconds / 60) if duration_seconds > 0 else 0
    norm_density = min(volume_per_minute / 200, 1.0) * 100  # Assume 200kg/min is high density
    
    # Rest Stress: Less rest = more stress
    total_rest = sum(ex.rest_time for ex in completed_exercises)
    avg_rest = total_rest / len(completed_exercises) if completed_exercises else 90
    # Assume 90s is baseline. 30s is high stress (100), 180s is low stress (0)
    norm_rest = max(0, min(100, (180 - avg_rest) / 1.5))
    
    # Complexity: Multi-muscle and exercise count
    complexity_score = min(len(completed_exercises) * 10, 100)
    
    score = (
        (norm_volume * 0.30) +
        (norm_intensity * 0.30) +
        (norm_density * 0.20) +
        (norm_rest * 0.10) +
        (complexity_score * 0.10)
    )
    
    return round(score, 2)

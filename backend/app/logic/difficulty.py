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
    
    # Calculate volume: Regular weight volume + Time-based volume (1s = 5kg equivalent)
    weight_volume = sum(ex.sets_completed * sum(ex.reps) * ex.weight for ex in completed_exercises if not ex.is_time_based)
    time_volume = sum(sum(ex.active_times or ex.reps) * 5 for ex in completed_exercises if ex.is_time_based)
    total_volume = weight_volume + time_volume
    
    # Normalization factors
    norm_volume = min(total_volume / 10000, 1.0) * 100
    
    # Intensity based on routine baseline difficulty (1-5 -> 0-100)
    norm_intensity = (routine_difficulty / 5) * 100
    
    # Density: Volume per minute (using active time only if possible, but duration_seconds is total)
    active_seconds = sum(sum(ex.active_times or ex.reps) for ex in completed_exercises)
    density_seconds = max(active_seconds, duration_seconds / 2) # Prevent extreme scores if session was very short
    volume_per_minute = total_volume / (density_seconds / 60) if density_seconds > 0 else 0
    norm_density = min(volume_per_minute / 200, 1.0) * 100 
    
    # Rest Stress
    total_rest = sum(ex.rest_time for ex in completed_exercises)
    avg_rest = total_rest / len(completed_exercises) if completed_exercises else 90
    norm_rest = max(0, min(100, (180 - avg_rest) / 1.5))
    
    # Complexity
    complexity_score = min(len(completed_exercises) * 10, 100)
    
    score = (
        (norm_volume * 0.30) +
        (norm_intensity * 0.30) +
        (norm_density * 0.20) +
        (norm_rest * 0.10) +
        (complexity_score * 0.10)
    )
    
    return round(score, 2)

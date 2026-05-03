import math

def calculate_session_xp(duration_seconds: int, total_volume: float, difficulty_score: float) -> int:
    """
    Formula: (Volume / 10) + (Time_Min * Difficulty * 2)
    """
    duration_min = duration_seconds / 60
    volume_xp = total_volume / 10
    intensity_xp = duration_min * difficulty_score * 2
    
    return int(volume_xp + intensity_xp)

def get_level_from_xp(xp: int) -> int:
    """
    Simple progression: Level 1 starts at 0 XP. 
    Level 2 at 1000, Level 3 at 2500, Level 4 at 5000, etc.
    Formula: floor(sqrt(xp / 250)) + 1
    """
    if xp <= 0: return 1
    return int(math.floor(math.sqrt(xp / 250)) + 1)

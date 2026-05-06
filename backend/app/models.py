from typing import List, Optional, Union, Annotated
from datetime import datetime
from beanie import Document, Indexed
from pydantic import BaseModel, Field

class User(Document):
    name: str
    email: Annotated[str, Indexed(unique=True)]
    hashed_password: str
    level: int = 1
    xp: int = 0
    weight: Optional[float] = None  # in kg
    height: Optional[float] = None  # in cm
    created_at: datetime = Field(default_factory=datetime.now)


    class Settings:
        name = "users"

class MuscleGroup(Document):
    name: str
    region: str  # upper, lower, core
    svg_region_id: str

    class Settings:
        name = "muscle_groups"

class MovementPattern(Document):
    name: str
    category: str  # push, pull, lower, core

    class Settings:
        name = "movement_patterns"

class ExerciseMedia(BaseModel):
    start_image: Optional[str] = None
    end_image: Optional[str] = None
    gif: Optional[str] = None

class ExerciseMetrics(BaseModel):
    avg_duration_seconds: int = 45
    estimated_calories_minute: int = 8

class LocalizedList(BaseModel):
    en: List[str] = []
    es: List[str] = []

class Exercise(Document):
    name: str
    slug: Annotated[str, Indexed(unique=True)]
    primary_muscles: List[str]
    secondary_muscles: List[str] = []
    movement_patterns: LocalizedList = Field(default_factory=LocalizedList)
    tags: List[str] = []
    equipment: List[str] = []
    difficulty: int  # 1-5 scale
    exercise_type: str = "strength"
    instructions: LocalizedList = Field(default_factory=LocalizedList)
    media: ExerciseMedia = Field(default_factory=ExerciseMedia)
    metrics: ExerciseMetrics = Field(default_factory=ExerciseMetrics)

    class Settings:
        name = "exercises"

class RoutineBlock(BaseModel):
    type: str  # "exercise" or "superset"
    exercise_id: Optional[str] = None
    exercise_name: Optional[str] = None  # Added for denormalized display
    exercises: Optional[List[dict]] = None  # For supersets, will contain {exercise_id, exercise_name, ...}
    sets: Optional[int] = None
    reps: Optional[int] = None
    weight: float = 0
    time_minutes: int = 0
    rest_seconds: int = 90
    is_time_based: bool = False

class Routine(Document):
    user_id: str
    name: str
    difficulty: int
    blocks: List[RoutineBlock]
    created_at: datetime = Field(default_factory=datetime.now)

    class Settings:
        name = "routines"

class CompletedExercise(BaseModel):
    exercise_id: str
    sets_completed: int
    reps: List[int]
    weight: float
    active_time: int  # seconds
    rest_time: int  # seconds
    is_time_based: bool = False

class WorkoutSession(Document):
    user_id: str
    routine_id: Optional[str] = None
    routine_name: Optional[str] = None
    duration_seconds: int

    total_volume: float
    difficulty_score: float = 0.0
    earned_xp: int = 0
    muscle_impact: Optional[dict] = None # Map of muscle_id -> fatigue_level
    started_at: datetime


    completed_at: datetime = Field(default_factory=datetime.now)
    completed_exercises: List[CompletedExercise]


    class Settings:
        name = "workout_sessions"

class MuscleRecovery(Document):
    user_id: str
    muscle: str
    fatigue_score: float
    recovery_score: float
    status: str  # "fresh", "recovering", "fatigued"
    updated_at: datetime = Field(default_factory=datetime.now)

    class Settings:
        name = "muscle_recovery"

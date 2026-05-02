from fastapi import APIRouter, HTTPException
from typing import List
from app.models import WorkoutSession, Routine
from app.logic.difficulty import calculate_difficulty
from datetime import datetime

router = APIRouter()

@router.get("/", response_model=List[WorkoutSession])
async def get_sessions(user_id: str):
    return await WorkoutSession.find(WorkoutSession.user_id == user_id).sort(-WorkoutSession.started_at).to_list()

@router.post("/start", response_model=WorkoutSession)
async def start_session(user_id: str, routine_id: str = None):
    session = WorkoutSession(
        user_id=user_id,
        routine_id=routine_id,
        duration_seconds=0,
        total_volume=0,
        difficulty_score=0,
        started_at=datetime.now(),
        completed_exercises=[]
    )
    await session.insert()
    return session

@router.post("/{session_id}/complete", response_model=WorkoutSession)
async def complete_session(session_id: str, session_data: WorkoutSession):
    db_session = None
    if session_id == "new":
        db_session = WorkoutSession(
            user_id=session_data.user_id,
            routine_id=session_data.routine_id,
            started_at=datetime.now(), # Approximate
            completed_exercises=[]
        )
        await db_session.insert()
    else:
        db_session = await WorkoutSession.get(session_id)
        
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Calculate difficulty
    routine_difficulty = 3 # Default
    if db_session.routine_id:
        routine = await Routine.get(db_session.routine_id)
        if routine:
            routine_difficulty = routine.difficulty
            
    difficulty = calculate_difficulty(
        session_data.duration_seconds,
        session_data.completed_exercises,
        routine_difficulty
    )
    
    # Calculate total volume
    total_volume = 0
    for ex in session_data.completed_exercises:
        # handle different possible exercise structures
        volume = (ex.weight or 0) * (ex.reps or 0)
        if hasattr(ex, 'sets_completed') and ex.sets_completed:
            total_volume += volume * ex.sets_completed
        else:
            total_volume += volume

    # Update db_session
    db_session.duration_seconds = session_data.duration_seconds
    db_session.total_volume = total_volume
    db_session.difficulty_score = difficulty
    db_session.completed_exercises = session_data.completed_exercises
    db_session.completed_at = datetime.now()
    
    await db_session.save()
    return db_session

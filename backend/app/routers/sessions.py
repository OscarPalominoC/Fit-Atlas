from fastapi import APIRouter, HTTPException
from typing import List
from app.models import WorkoutSession, Routine, User, Exercise, MuscleRecovery, Stretch

from app.logic.difficulty import calculate_difficulty
from app.logic.progression import calculate_session_xp, get_level_from_xp
from datetime import datetime

router = APIRouter()

@router.get("/", response_model=List[WorkoutSession])
async def get_sessions(user_id: str):
    return await WorkoutSession.find(WorkoutSession.user_id == user_id).sort(-WorkoutSession.started_at).to_list()

@router.post("/start", response_model=WorkoutSession)
async def start_session(user_id: str, routine_id: str = None):
    # Get routine name if exists
    routine_name = "Free Session"
    if routine_id:
        routine = await Routine.get(routine_id)
        if routine:
            routine_name = routine.name

    session = WorkoutSession(
        user_id=user_id,
        routine_id=routine_id,
        routine_name=routine_name,
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
    print(f"DEBUG: complete_session called with ID: '{session_id}'")
    db_session = None
    if not session_id or session_id == "new" or session_id == "null" or session_id == "undefined":

        db_session = WorkoutSession(
            user_id=session_data.user_id,
            routine_id=session_data.routine_id,
            routine_name=session_data.routine_name or "Free Session",
            started_at=datetime.now(),
            completed_exercises=[]
        )
        await db_session.insert()
    else:
        db_session = await WorkoutSession.get(session_id)
        
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Calculate difficulty
    routine_difficulty = 3 
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
        if ex.is_time_based:
            # 1 second = 5kg equivalent
            volume = sum(ex.active_times or ex.reps or [0]) * 5
        else:
            volume = (ex.weight or 0) * sum(ex.reps or [0])
        total_volume += volume

    # Update db_session
    db_session.duration_seconds = session_data.duration_seconds
    db_session.total_volume = total_volume
    db_session.difficulty_score = difficulty
    db_session.completed_exercises = session_data.completed_exercises
    db_session.completed_at = datetime.now()
    
    await db_session.save()

    # Update Muscle Recovery / Fatigue
    muscle_impact = {}
    recovery_impact = {}
    for ex_data in db_session.completed_exercises:
        exercise = await Exercise.find_one(Exercise.name == ex_data.exercise_id)
        if exercise:
            for m in exercise.primary_muscles:
                muscle_impact[m.lower()] = max(muscle_impact.get(m.lower(), 0), 3)
            for m in exercise.secondary_muscles:
                muscle_impact[m.lower()] = max(muscle_impact.get(m.lower(), 0), 2)
        else:
            stretch = await Stretch.find_one(Stretch.name == ex_data.exercise_id)
            if stretch:
                bonus = stretch.recovery_score or 1
                for m in stretch.primary_muscles:
                    m_id = m.lower()
                    recovery_impact[m_id] = recovery_impact.get(m_id, 0) + bonus
                for m in stretch.secondary_muscles:
                    m_id = m.lower()
                    recovery_impact[m_id] = recovery_impact.get(m_id, 0) + (bonus / 2)

    for m_id, level in muscle_impact.items():
        recovery = await MuscleRecovery.find_one(
            MuscleRecovery.user_id == db_session.user_id,
            MuscleRecovery.muscle == m_id.lower()
        )
        if not recovery:
            recovery = MuscleRecovery(
                user_id=db_session.user_id,
                muscle=m_id.lower(),
                fatigue_score=level,
                recovery_score=0,
                status="fatigued" if level > 1 else "recovering"
            )
        else:
            # If it's already more tired, keep it that way. Otherwise update to current peak.
            recovery.fatigue_score = max(recovery.fatigue_score, level)
            recovery.status = "fatigued" if recovery.fatigue_score > 1 else "recovering"
            recovery.updated_at = datetime.now()
        await recovery.save()

    # Apply Recovery Bonus from Stretches
    for m_id, bonus in recovery_impact.items():
        recovery = await MuscleRecovery.find_one(
            MuscleRecovery.user_id == db_session.user_id,
            MuscleRecovery.muscle == m_id.lower()
        )
        if recovery:
            recovery.fatigue_score = max(0, recovery.fatigue_score - bonus)
            recovery.status = "fatigued" if recovery.fatigue_score > 1 else "recovering"
            if recovery.fatigue_score == 0:
                recovery.status = "recovered"
            recovery.updated_at = datetime.now()
            await recovery.save()


    db_session.muscle_impact = muscle_impact

    # Update User XP and Level

    user = await User.get(db_session.user_id)
    if user:
        earned_xp = calculate_session_xp(db_session.duration_seconds, db_session.total_volume, db_session.difficulty_score)
        user.xp += earned_xp
        user.level = get_level_from_xp(user.xp)
        db_session.earned_xp = earned_xp
        await user.save()
        await db_session.save()



    return db_session


@router.delete("/{session_id}")
async def delete_session(session_id: str):
    session = await WorkoutSession.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    await session.delete()
    return {"status": "success"}

@router.patch("/{session_id}")
async def update_session(session_id: str, data: dict):
    session = await WorkoutSession.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if "routine_name" in data:
        session.routine_name = data["routine_name"]
    
    await session.save()
    return session


from datetime import datetime, timedelta
from typing import Dict, List
from app.models import WorkoutSession, Exercise, Routine, MuscleRecovery
from beanie.operators import In

ANTERIOR_MUSCLES = {"chest", "abs", "obliques", "biceps", "deltoids", "quadriceps", "adductors", "forearm"}
POSTERIOR_MUSCLES = {"trapezius", "upper-back", "lower-back", "triceps", "gluteal", "hamstring", "calves"}
CORE_MUSCLES = {"abs", "obliques", "lower-back"}

RECOVERY_HOURS = 48  # Time for full recovery (100% to 0% fatigue)

async def calculate_efficiency(user_id: str) -> float:
    # Efficiency based on completed vs planned sets in the last 7 sessions
    sessions = await WorkoutSession.find(WorkoutSession.user_id == user_id).sort(-WorkoutSession.started_at).limit(7).to_list()
    
    if not sessions:
        return 0.0
    
    total_efficiency = 0.0
    valid_sessions = 0
    
    for session in sessions:
        if not session.routine_id:
            continue
            
        routine = await Routine.get(session.routine_id)
        if not routine:
            continue
            
        planned_sets = sum(block.sets for block in routine.blocks if block.sets is not None)
        completed_sets = sum(ex.sets_completed for ex in session.completed_exercises)
        
        if planned_sets > 0:
            session_efficiency = min(100.0, (completed_sets / planned_sets) * 100)
            total_efficiency += session_efficiency
            valid_sessions += 1
            
    if valid_sessions == 0:
        # Fallback to a consistency-based metric if no routines are linked
        # e.g., frequency of training. For now, let's return a default realistic value 
        # or calculate based on difficulty score.
        avg_difficulty = sum(s.difficulty_score for s in sessions) / len(sessions)
        return min(100.0, 70.0 + (avg_difficulty * 5)) # Mock logic for consistency
        
    return total_efficiency / valid_sessions

async def get_focus_distribution(user_id: str) -> Dict[str, float]:
    # Look at sessions from the last 30 days
    since = datetime.now() - timedelta(days=30)
    sessions = await WorkoutSession.find(WorkoutSession.user_id == user_id, WorkoutSession.started_at >= since).to_list()
    
    if not sessions:
        return {"Anterior": 0.0, "Posterior": 0.0, "Core": 0.0}
    
    scores = {"Anterior": 0.0, "Posterior": 0.0, "Core": 0.0}
    
    # Cache exercises to avoid redundant DB calls
    exercise_ids = set()
    for session in sessions:
        for ex in session.completed_exercises:
            exercise_ids.add(ex.exercise_id)
            
    exercises = await Exercise.find(In(Exercise.id, list(exercise_ids))).to_list()
    exercise_map = {str(ex.id): ex for ex in exercises}
    
    for session in sessions:
        for completed_ex in session.completed_exercises:
            ex_data = exercise_map.get(completed_ex.exercise_id)
            if not ex_data:
                continue
                
            volume = completed_ex.sets_completed * sum(completed_ex.reps) / len(completed_ex.reps) if completed_ex.reps else 0
            
            muscles = set(ex_data.primary_muscles) | set(ex_data.secondary_muscles)
            
            for muscle in muscles:
                if muscle in ANTERIOR_MUSCLES:
                    scores["Anterior"] += volume
                if muscle in POSTERIOR_MUSCLES:
                    scores["Posterior"] += volume
                if muscle in CORE_MUSCLES:
                    scores["Core"] += volume
                    
    total = sum(scores.values())
    if total == 0:
        return {"Anterior": 0.0, "Posterior": 0.0, "Core": 0.0}
        
    return {k: round((v / total) * 100, 1) for k, v in scores.items()}

async def get_muscle_recovery_states(user_id: str) -> Dict[str, dict]:
    # Get all muscles known to the system
    all_muscles = ANTERIOR_MUSCLES | POSTERIOR_MUSCLES | CORE_MUSCLES
    
    # 1. Fetch persistent recovery records
    recovery_records = await MuscleRecovery.find(MuscleRecovery.user_id == user_id).to_list()
    recovery_map = {r.muscle: r for r in recovery_records}
    
    # 2. If no records, fallback to scanning last sessions to initialize
    if not recovery_records:
        sessions = await WorkoutSession.find(WorkoutSession.user_id == user_id).sort(-WorkoutSession.started_at).limit(10).to_list()
        # Collect exercise info
        exercise_ids = set()
        for session in sessions:
            for ex in session.completed_exercises:
                exercise_ids.add(ex.exercise_id)
        
        exercises = await Exercise.find(In(Exercise.id, list(exercise_ids))).to_list()
        exercise_map = {str(ex.id): ex for ex in exercises}
        
        last_trained: Dict[str, datetime] = {}
        for session in sessions:
            for completed_ex in session.completed_exercises:
                ex_data = exercise_map.get(completed_ex.exercise_id)
                if not ex_data: continue
                muscles = set(ex_data.primary_muscles) | set(ex_data.secondary_muscles)
                for muscle in muscles:
                    if muscle.lower() not in last_trained:
                        last_trained[muscle.lower()] = session.completed_at or session.started_at
        
        # Create initial records
        for muscle, l_time in last_trained.items():
            hours_since = (datetime.now() - l_time).total_seconds() / 3600
            initial_fatigue = max(0, 3 - (hours_since / (RECOVERY_HOURS/3))) # 3 levels, decay over RECOVERY_HOURS
            if initial_fatigue > 0:
                rec = MuscleRecovery(user_id=user_id, muscle=muscle, fatigue_score=initial_fatigue, recovery_score=0, status="recovering")
                await rec.save()
                recovery_map[muscle] = rec

    states = {}
    now = datetime.now()
    
    MUSCLE_STATES_CONFIG = {
        "recovered": {"level": 0, "color": "#22c55e"},
        "light_fatigue": {"level": 1, "color": "#eab308"},
        "moderate_fatigue": {"level": 2, "color": "#f97316"},
        "high_fatigue": {"level": 3, "color": "#ef4444"}
    }
    
    for muscle in all_muscles:
        record = recovery_map.get(muscle)
        
        if not record:
            states[muscle] = {**MUSCLE_STATES_CONFIG["recovered"], "key": "recovered"}
            continue
            
        hours_since = (now - record.updated_at).total_seconds() / 3600
        
        # Apply decay to the stored fatigue score
        # RECOVERY_HOURS is for full 100% (level 3) to 0% decay
        decayed_score = max(0, record.fatigue_score - (hours_since / (RECOVERY_HOURS/3)))
        
        if decayed_score >= 2.5:
            state_key = "high_fatigue"
        elif decayed_score >= 1.5:
            state_key = "moderate_fatigue"
        elif decayed_score >= 0.5:
            state_key = "light_fatigue"
        else:
            state_key = "recovered"
            
        states[muscle] = {**MUSCLE_STATES_CONFIG[state_key], "key": state_key}
        
    return states


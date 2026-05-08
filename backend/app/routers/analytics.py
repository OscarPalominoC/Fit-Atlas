from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from app.logic.analytics import (
    calculate_efficiency, 
    get_focus_distribution, 
    get_muscle_recovery_states, 
    get_performance_delta,
    get_muscle_volume_stats,
    get_training_consistency,
    get_strength_progress
)

router = APIRouter()

@router.get("/summary/{user_id}")
async def get_analytics_summary(user_id: str) -> Dict[str, Any]:
    try:
        efficiency = await calculate_efficiency(user_id)
        focus = await get_focus_distribution(user_id)
        delta = await get_performance_delta(user_id)
        muscle_stats = await get_muscle_volume_stats(user_id)
        consistency = await get_training_consistency(user_id)
        strength = await get_strength_progress(user_id)
        
        return {
            "efficiency": round(efficiency, 1),
            "focus_distribution": focus,
            "performance_delta": delta,
            "muscle_stats": muscle_stats,
            "consistency": consistency,
            "strength_progress": strength
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/recovery/{user_id}")
async def get_muscle_recovery(user_id: str) -> Dict[str, Any]:
    try:
        states = await get_muscle_recovery_states(user_id)
        return states
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

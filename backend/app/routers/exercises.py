from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from app.models import Exercise

router = APIRouter()

@router.get("/", response_model=List[Exercise])
async def get_exercises(
    muscle: Optional[str] = None,
    equipment: Optional[str] = None,
    tag: Optional[str] = None
):
    query = {}
    if muscle:
        query["primary_muscles"] = muscle
    if equipment:
        query["equipment"] = equipment
    if tag:
        query["tags"] = tag
        
    exercises = await Exercise.find(query).to_list()
    return exercises

@router.get("/{exercise_id}", response_model=Exercise)
async def get_exercise(exercise_id: str):
    exercise = await Exercise.get(exercise_id)
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")
    return exercise

@router.post("/", response_model=Exercise)
async def create_exercise(exercise: Exercise):
    await exercise.insert()
    return exercise

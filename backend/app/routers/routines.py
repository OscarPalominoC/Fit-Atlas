from fastapi import APIRouter, HTTPException
from typing import List
from app.models import Routine

router = APIRouter()

@router.get("/", response_model=List[Routine])
async def get_routines(user_id: str):
    routines = await Routine.find(Routine.user_id == user_id).to_list()
    return routines

@router.post("/", response_model=Routine)
async def create_routine(routine: Routine):
    await routine.insert()
    return routine

@router.get("/{routine_id}", response_model=Routine)
async def get_routine(routine_id: str):
    routine = await Routine.get(routine_id)
    if not routine:
        raise HTTPException(status_code=404, detail="Routine not found")
    return routine

@router.put("/{routine_id}", response_model=Routine)
async def update_routine(routine_id: str, routine_update: Routine):
    routine = await Routine.get(routine_id)
    if not routine:
        raise HTTPException(status_code=404, detail="Routine not found")
    await routine.update({"$set": routine_update.dict(exclude_unset=True, exclude={"id", "user_id"})})
    return await Routine.get(routine_id)

@router.delete("/{routine_id}")
async def delete_routine(routine_id: str):
    routine = await Routine.get(routine_id)
    if not routine:
        raise HTTPException(status_code=404, detail="Routine not found")
    await routine.delete()
    return {"message": "Routine deleted"}

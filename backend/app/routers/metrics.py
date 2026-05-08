from fastapi import APIRouter, HTTPException
from typing import List
from app.models import BodyMetric
from datetime import datetime

router = APIRouter()

@router.get("/{user_id}", response_model=List[BodyMetric])
async def get_body_metrics(user_id: str):
    return await BodyMetric.find(BodyMetric.user_id == user_id).sort(-BodyMetric.date).to_list()

@router.post("/", response_model=BodyMetric)
async def add_body_metric(metric: BodyMetric):
    await metric.insert()
    return metric

@router.delete("/{metric_id}")
async def delete_body_metric(metric_id: str):
    metric = await BodyMetric.get(metric_id)
    if not metric:
        raise HTTPException(status_code=404, detail="Metric not found")
    await metric.delete()
    return {"status": "success"}

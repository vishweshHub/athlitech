from database.mongodb import performance_collection, athletes_collection, users_collection
from models.performance_model import Performance
from fastapi import HTTPException


async def add_performance(performance: Performance):
    await performance_collection.insert_one(performance.dict())
    return {"message": "Performance record added", "performance_id": performance.performance_id}


async def get_athlete_performances(athlete_id: str):
    records = []
    async for perf in performance_collection.find({"athlete_id": athlete_id}):
        records.append(perf)
    return records

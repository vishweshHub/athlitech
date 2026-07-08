from repositories.performance_repository import performance_repository
from models.performance_model import Performance


async def add_performance(performance: Performance):
    await performance_repository.create(performance.dict())
    return {"message": "Performance record added", "performance_id": performance.performance_id}


async def get_athlete_performances(athlete_id: str):
    return await performance_repository.get_by_athlete(athlete_id)

from typing import List, Optional
from bson.objectid import ObjectId
from database import mongodb


class PerformanceLogRepository:
    def __init__(self):
        self._collection = None

    @property
    def collection(self):
        if self._collection is not None:
            return self._collection
        try:
            from routes import performance_log_routes
            if hasattr(performance_log_routes, "performance_logs_collection"):
                return performance_log_routes.performance_logs_collection
        except ImportError:
            pass
        return mongodb.performance_logs_collection

    @collection.setter
    def collection(self, value):
        self._collection = value

    async def create_performance_log(self, doc: dict) -> dict:
        data = dict(doc)
        if "id" not in data:
            data["id"] = str(ObjectId())
        await self.collection.insert_one(data)
        return data

    async def find_log_by_id(self, log_id: str) -> Optional[dict]:
        log = await self.collection.find_one({"id": log_id})
        if not log and ObjectId.is_valid(log_id):
            log = await self.collection.find_one({"_id": ObjectId(log_id)})
        return log

    async def find_log_by_session_id(self, workout_session_id: str) -> Optional[dict]:
        return await self.collection.find_one({"workout_session_id": workout_session_id})

    async def find_log_by_session_and_assignment(self, workout_session_id: str, assignment_id: str) -> Optional[dict]:
        return await self.collection.find_one({
            "workout_session_id": workout_session_id,
            "assignment_id": assignment_id
        })

    async def get_logs_by_workout_session(self, workout_session_id: str) -> List[dict]:
        logs = []
        cursor = self.collection.find({"workout_session_id": workout_session_id})
        async for l in cursor:
            logs.append(l)
        return logs

    async def get_logs_by_athlete(self, athlete_id: str, skip: int = 0, limit: int = 100) -> List[dict]:
        logs = []
        cursor = self.collection.find({"athlete_id": athlete_id}).sort("recorded_at", -1).skip(skip).limit(limit)
        async for l in cursor:
            logs.append(l)
        return logs

    async def get_athlete_historical_logs_for_metric(self, athlete_id: str, metric_key: str) -> List[dict]:
        logs = []
        query = {
            "athlete_id": athlete_id,
            f"metrics.{metric_key}": {"$exists": True}
        }
        cursor = self.collection.find(query)
        async for l in cursor:
            logs.append(l)
        return logs


performance_log_repository = PerformanceLogRepository()

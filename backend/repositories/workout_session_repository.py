from typing import List, Optional
from bson.objectid import ObjectId
from database import mongodb


class WorkoutSessionRepository:
    def __init__(self):
        self._collection = None

    @property
    def collection(self):
        if self._collection is not None:
            return self._collection
        try:
            from routes import workout_session_routes
            if hasattr(workout_session_routes, "workout_sessions_collection"):
                return workout_session_routes.workout_sessions_collection
        except ImportError:
            pass
        return mongodb.workout_sessions_collection

    @collection.setter
    def collection(self, value):
        self._collection = value

    async def create_workout_session(self, doc: dict) -> dict:
        data = dict(doc)
        if "id" not in data:
            data["id"] = str(ObjectId())
        await self.collection.insert_one(data)
        return data

    async def find_workout_session_by_id(self, workout_session_id: str) -> Optional[dict]:
        ws = await self.collection.find_one({"id": workout_session_id})
        if not ws and ObjectId.is_valid(workout_session_id):
            ws = await self.collection.find_one({"_id": ObjectId(workout_session_id)})
        return ws

    async def find_active_workout_session_by_athlete(self, athlete_id: str) -> Optional[dict]:
        ws = await self.collection.find_one({
            "athlete_id": athlete_id,
            "status": {"$in": ["in_progress", "paused"]}
        })
        return ws

    async def update_workout_session(self, workout_session_id: str, changes: dict) -> Optional[dict]:
        result = await self.collection.update_one(
            {"$or": [{"id": workout_session_id}, {"_id": ObjectId(workout_session_id)}]} if ObjectId.is_valid(workout_session_id) else {"id": workout_session_id},
            {"$set": changes}
        )
        if result.matched_count == 0:
            return None
        return await self.find_workout_session_by_id(workout_session_id)

    async def delete_workout_session(self, workout_session_id: str) -> bool:
        res = await self.collection.delete_one(
            {"$or": [{"id": workout_session_id}, {"_id": ObjectId(workout_session_id)}]} if ObjectId.is_valid(workout_session_id) else {"id": workout_session_id}
        )
        return res.deleted_count > 0


workout_session_repository = WorkoutSessionRepository()

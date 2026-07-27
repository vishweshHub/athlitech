from typing import List, Optional
from bson.objectid import ObjectId
from database import mongodb


class SessionRepository:
    def __init__(self):
        self._sessions_collection = None

    @property
    def sessions_collection(self):
        if self._sessions_collection is not None:
            return self._sessions_collection
        try:
            from routes import session_routes
            if hasattr(session_routes, "sessions_collection"):
                return session_routes.sessions_collection
        except ImportError:
            pass
        return mongodb.sessions_collection

    @sessions_collection.setter
    def sessions_collection(self, value):
        self._sessions_collection = value

    async def create_session(self, session_data: dict) -> dict:
        doc = dict(session_data)
        if "id" not in doc:
            doc["id"] = str(ObjectId())
        await self.sessions_collection.insert_one(doc)
        return doc

    async def get_sessions_by_day(self, training_day_id: str) -> List[dict]:
        sessions = []
        cursor = self.sessions_collection.find({"training_day_id": training_day_id}).sort("order", 1)
        async for s in cursor:
            sessions.append(s)
        return sessions

    async def find_session_by_id(self, session_id: str) -> Optional[dict]:
        session = await self.sessions_collection.find_one({"id": session_id})
        if not session and ObjectId.is_valid(session_id):
            session = await self.sessions_collection.find_one({"_id": ObjectId(session_id)})
        return session

    async def find_session_by_day_and_order(self, training_day_id: str, order: int) -> Optional[dict]:
        session = await self.sessions_collection.find_one({"training_day_id": training_day_id, "order": order})
        return session

    async def update_session(self, session_id: str, changes: dict) -> Optional[dict]:
        result = await self.sessions_collection.update_one(
            {"$or": [{"id": session_id}, {"_id": ObjectId(session_id)}]} if ObjectId.is_valid(session_id) else {"id": session_id},
            {"$set": changes}
        )
        if result.matched_count == 0:
            return None
        return await self.find_session_by_id(session_id)

    async def delete_session(self, session_id: str) -> bool:
        from repositories.workout_assignment_repository import workout_assignment_repository
        await workout_assignment_repository.delete_assignments_by_session(session_id)
        res = await self.sessions_collection.delete_one(
            {"$or": [{"id": session_id}, {"_id": ObjectId(session_id)}]} if ObjectId.is_valid(session_id) else {"id": session_id}
        )
        return res.deleted_count > 0

    async def delete_sessions_by_day(self, training_day_id: str) -> int:
        from repositories.workout_assignment_repository import workout_assignment_repository
        sessions = await self.get_sessions_by_day(training_day_id)
        for s in sessions:
            sid = s.get("id") or str(s.get("_id"))
            await workout_assignment_repository.delete_assignments_by_session(sid)
        res = await self.sessions_collection.delete_many({"training_day_id": training_day_id})
        return res.deleted_count



session_repository = SessionRepository()

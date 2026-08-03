"""
AthliTech Session Repository.

Provides data access methods for managing training plan sessions.
"""

from typing import List, Optional, Dict, Any
from bson.objectid import ObjectId
from database import mongodb
from database.utils import to_object_id, fetch_cursor_list


class SessionRepository:
    """Repository handling CRUD operations for sessions collection."""

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
        """Creates a new session document."""
        doc = dict(session_data)
        if "id" not in doc:
            doc["id"] = str(ObjectId())
        await self.sessions_collection.insert_one(doc)
        return doc

    async def get_sessions_by_day(self, training_day_id: str) -> List[Dict[str, Any]]:
        """Gets all sessions for a specific training day ordered by 'order'."""
        cursor = self.sessions_collection.find({"training_day_id": training_day_id}).sort("order", 1)
        return await fetch_cursor_list(cursor)

    async def find_session_by_id(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Finds session by string id or BSON ObjectId."""
        session = await self.sessions_collection.find_one({"id": session_id})
        oid = to_object_id(session_id)
        if not session and oid:
            session = await self.sessions_collection.find_one({"_id": oid})
        return session

    async def find_session_by_day_and_order(self, training_day_id: str, order: int) -> Optional[Dict[str, Any]]:
        """Finds session by training_day_id and order position."""
        session = await self.sessions_collection.find_one({"training_day_id": training_day_id, "order": order})
        return session

    async def update_session(self, session_id: str, changes: dict) -> Optional[Dict[str, Any]]:
        """Updates session fields by ID."""
        oid = to_object_id(session_id)
        query = {"$or": [{"id": session_id}, {"_id": oid}]} if oid else {"id": session_id}
        result = await self.sessions_collection.update_one(query, {"$set": changes})
        if result.matched_count == 0:
            return None
        return await self.find_session_by_id(session_id)

    async def delete_session(self, session_id: str) -> bool:
        """Deletes session and cascading workout assignments."""
        from repositories.workout_assignment_repository import workout_assignment_repository
        await workout_assignment_repository.delete_assignments_by_session(session_id)
        oid = to_object_id(session_id)
        query = {"$or": [{"id": session_id}, {"_id": oid}]} if oid else {"id": session_id}
        res = await self.sessions_collection.delete_one(query)
        return res.deleted_count > 0

    async def delete_sessions_by_day(self, training_day_id: str) -> int:
        """Deletes all sessions for a training day with cascading assignments."""
        from repositories.workout_assignment_repository import workout_assignment_repository
        sessions = await self.get_sessions_by_day(training_day_id)
        for s in sessions:
            sid = s.get("id") or str(s.get("_id"))
            await workout_assignment_repository.delete_assignments_by_session(sid)
        res = await self.sessions_collection.delete_many({"training_day_id": training_day_id})
        return res.deleted_count


session_repository = SessionRepository()


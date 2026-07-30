from typing import List, Optional
from bson.objectid import ObjectId
from database import mongodb


class WorkoutAssignmentRepository:
    def __init__(self):
        self._collection = None

    @property
    def collection(self):
        if self._collection is not None:
            return self._collection
        try:
            from routes import workout_assignment_routes
            if hasattr(workout_assignment_routes, "workout_assignments_collection"):
                return workout_assignment_routes.workout_assignments_collection
        except ImportError:
            pass
        return mongodb.workout_assignments_collection

    @collection.setter
    def collection(self, value):
        self._collection = value

    async def create_assignment(self, assignment_data: dict) -> dict:
        doc = dict(assignment_data)
        if "id" not in doc:
            doc["id"] = str(ObjectId())
        await self.collection.insert_one(doc)
        return doc

    async def get_assignments_by_session(self, session_id: str) -> List[dict]:
        assignments = []
        cursor = self.collection.find({"session_id": session_id}).sort("order", 1)
        async for a in cursor:
            assignments.append(a)
        return assignments

    async def find_assignment_by_id(self, assignment_id: str) -> Optional[dict]:
        assignment = await self.collection.find_one({"id": assignment_id})
        if not assignment and ObjectId.is_valid(assignment_id):
            assignment = await self.collection.find_one({"_id": ObjectId(assignment_id)})
        return assignment

    async def find_assignment_by_session_and_order(self, session_id: str, order: int) -> Optional[dict]:
        assignment = await self.collection.find_one({"session_id": session_id, "order": order})
        return assignment

    async def update_assignment(self, assignment_id: str, changes: dict) -> Optional[dict]:
        result = await self.collection.update_one(
            {"$or": [{"id": assignment_id}, {"_id": ObjectId(assignment_id)}]} if ObjectId.is_valid(assignment_id) else {"id": assignment_id},
            {"$set": changes}
        )
        if result.matched_count == 0:
            return None
        return await self.find_assignment_by_id(assignment_id)

    async def delete_assignment(self, assignment_id: str) -> bool:
        res = await self.collection.delete_one(
            {"$or": [{"id": assignment_id}, {"_id": ObjectId(assignment_id)}]} if ObjectId.is_valid(assignment_id) else {"id": assignment_id}
        )
        return res.deleted_count > 0

    async def delete_assignments_by_session(self, session_id: str) -> int:
        res = await self.collection.delete_many({"session_id": session_id})
        return res.deleted_count


workout_assignment_repository = WorkoutAssignmentRepository()

from bson import ObjectId
from database import mongodb

class CoachRepository:
    @property
    def collection(self):
        return mongodb.users_collection

    async def find_by_coach_id(self, coach_id: str) -> dict | None:
        return await self.collection.find_one({"coach_id": coach_id})

    async def find_by_id(self, user_id: str) -> dict | None:
        if not ObjectId.is_valid(user_id):
            return None
        return await self.collection.find_one({"_id": ObjectId(user_id)})

coach_repository = CoachRepository()

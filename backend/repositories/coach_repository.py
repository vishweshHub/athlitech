from bson import ObjectId
from database import mongodb

class CoachRepository:
    @property
    def collection(self):
        try:
            from routes import workout_routes
            if hasattr(workout_routes, "users_collection"):
                return workout_routes.users_collection
        except ImportError:
            pass
        try:
            from routes import performance_routes
            if hasattr(performance_routes, "users_collection"):
                return performance_routes.users_collection
        except ImportError:
            pass
        try:
            from services import athlete_service
            if hasattr(athlete_service, "users_collection"):
                return athlete_service.users_collection
        except ImportError:
            pass
        return mongodb.users_collection

    async def find_by_coach_id(self, coach_id: str) -> dict | None:
        return await self.collection.find_one({"coach_id": coach_id})

    async def find_by_id(self, user_id: str) -> dict | None:
        if not ObjectId.is_valid(user_id):
            return None
        return await self.collection.find_one({"_id": ObjectId(user_id)})

coach_repository = CoachRepository()

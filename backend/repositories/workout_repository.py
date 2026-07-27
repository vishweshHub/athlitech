from database import mongodb
from bson.objectid import ObjectId

class WorkoutRepository:
    def __init__(self):
        self._collection = None

    @property
    def collection(self):
        if self._collection is not None:
            return self._collection
        try:
            from routes import workout_routes
            if hasattr(workout_routes, "workouts_collection"):
                return workout_routes.workouts_collection
        except ImportError:
            pass
        try:
            from services import workout_service
            if hasattr(workout_service, "workouts_collection"):
                return workout_service.workouts_collection
        except ImportError:
            pass
        return mongodb.workouts_collection

    @collection.setter
    def collection(self, value):
        self._collection = value


    async def create_template(self, workout_data: dict) -> dict:
        await self.collection.insert_one(workout_data)
        return workout_data

    async def get_templates(
        self,
        skip: int = 0,
        limit: int = 100,
        sport: str | None = None,
        category: str | None = None,
        difficulty: str | None = None,
        search: str | None = None
    ) -> list:
        query = {}
        if sport:
            query["sport"] = {"$regex": f"^{sport}$", "$options": "i"}
        if category:
            query["category"] = {"$regex": f"^{category}$", "$options": "i"}
        if difficulty:
            query["difficulty"] = {"$regex": f"^{difficulty}$", "$options": "i"}
        if search:
            query["$or"] = [
                {"title": {"$regex": search, "$options": "i"}},
                {"description": {"$regex": search, "$options": "i"}},
                {"sport": {"$regex": search, "$options": "i"}},
                {"category": {"$regex": search, "$options": "i"}},
                {"instructions": {"$regex": search, "$options": "i"}}
            ]
        
        cursor = self.collection.find(query)
        if hasattr(cursor, "skip"):
            cursor = cursor.skip(skip)
        if hasattr(cursor, "limit"):
            cursor = cursor.limit(limit)

        workouts = []
        async for w in cursor:
            workouts.append(w)
        return workouts

    async def find_template_by_id(self, workout_id: str) -> dict | None:
        query = {"$or": [{"id": workout_id}, {"workout_id": workout_id}]}
        if ObjectId.is_valid(workout_id):
            query["$or"].append({"_id": ObjectId(workout_id)})
        return await self.collection.find_one(query)

    async def update_template(self, workout_id: str, update_data: dict) -> dict | None:
        query = {"$or": [{"id": workout_id}, {"workout_id": workout_id}]}
        if ObjectId.is_valid(workout_id):
            query["$or"].append({"_id": ObjectId(workout_id)})
        
        result = await self.collection.update_one(query, {"$set": update_data})
        if result.matched_count == 0:
            return None
        return await self.collection.find_one(query)

    async def delete_template(self, workout_id: str) -> bool:
        query = {"$or": [{"id": workout_id}, {"workout_id": workout_id}]}
        if ObjectId.is_valid(workout_id):
            query["$or"].append({"_id": ObjectId(workout_id)})
        
        result = await self.collection.delete_one(query)
        return result.deleted_count > 0

    # Legacy Repository Methods
    async def create(self, workout_data: dict) -> dict:
        await self.collection.insert_one(workout_data)
        return workout_data

    async def get_by_coach(self, coach_id: str, skip: int = 0, limit: int = 100, status: str | None = None) -> list:
        query = {"coach_id": coach_id}
        if status:
            query["status"] = status
        cursor = self.collection.find(query)
        if hasattr(cursor, "skip"):
            cursor = cursor.skip(skip)
        if hasattr(cursor, "limit"):
            cursor = cursor.limit(limit)

        workouts = []
        async for w in cursor:
            workouts.append(w)
        return workouts

    async def get_by_athlete(self, athlete_id: str, skip: int = 0, limit: int = 100, status: str | None = None) -> list:
        query = {"athlete_id": athlete_id}
        if status:
            query["status"] = status
        cursor = self.collection.find(query)
        if hasattr(cursor, "skip"):
            cursor = cursor.skip(skip)
        if hasattr(cursor, "limit"):
            cursor = cursor.limit(limit)

        workouts = []
        async for w in cursor:
            workouts.append(w)
        return workouts

    async def find_by_workout_id(self, workout_id: str) -> dict | None:
        return await self.collection.find_one({"workout_id": workout_id})

    async def update_status(
        self,
        workout_id: str,
        status: str,
        completed_at: str | None = None,
        completion_percentage: int | None = None,
        athlete_notes: str | None = None
    ):
        update_data = {"status": status}
        if completed_at is not None:
            update_data["completed_at"] = completed_at
        if completion_percentage is not None:
            update_data["completion_percentage"] = completion_percentage
        if athlete_notes is not None:
            update_data["athlete_notes"] = athlete_notes
        return await self.collection.update_one(
            {"workout_id": workout_id},
            {"$set": update_data}
        )

workout_repository = WorkoutRepository()

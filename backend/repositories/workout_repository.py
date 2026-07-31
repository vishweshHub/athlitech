from database import mongodb
from bson.objectid import ObjectId

class WorkoutRepository:
    def __init__(self):
        self._collection = None

    @property
    def collection(self):
        if self._collection is not None:
            return self._collection
        return mongodb.workouts_collection

    @collection.setter
    def collection(self, value):
        self._collection = value

    def _build_id_query(self, workout_id: str) -> dict:
        query = {"$or": [{"id": workout_id}, {"workout_id": workout_id}]}
        if ObjectId.is_valid(workout_id):
            query["$or"].append({"_id": ObjectId(workout_id)})
        return query

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
        # Exclude legacy assigned-workout documents (they have athlete_id/coach_id
        # but lack sport/category/difficulty/duration_minutes required by WorkoutResponse).
        query: dict = {"athlete_id": {"$exists": False}, "sport": {"$exists": True, "$ne": None}}
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
        return await self.collection.find_one(self._build_id_query(workout_id))

    async def update_template(self, workout_id: str, update_data: dict) -> dict | None:
        query = self._build_id_query(workout_id)
        result = await self.collection.update_one(query, {"$set": update_data})
        if result.matched_count == 0:
            return None
        return await self.collection.find_one(query)

    async def delete_template(self, workout_id: str) -> bool:
        query = self._build_id_query(workout_id)
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

    async def get_distinct_sports(self) -> list:
        distinct_sports = await self.collection.distinct("sport", {"sport": {"$exists": True, "$ne": None}})
        return [s for s in distinct_sports if s and isinstance(s, str) and s.strip()]

    async def get_distinct_categories(self) -> list:
        distinct_cats = await self.collection.distinct("category", {"category": {"$exists": True, "$ne": None}})
        return [c for c in distinct_cats if c and isinstance(c, str) and c.strip()]

    async def get_distinct_difficulties(self) -> list:
        distinct_diffs = await self.collection.distinct("difficulty", {"difficulty": {"$exists": True, "$ne": None}})
        return [d for d in distinct_diffs if d and isinstance(d, str) and d.strip()]

    async def get_distinct_equipment(self) -> list:
        distinct_eq = await self.collection.distinct("equipment", {"equipment": {"$exists": True, "$ne": None}})
        res = set()
        for item in distinct_eq:
            if isinstance(item, list):
                for sub in item:
                    if sub and isinstance(sub, str):
                        res.add(sub.strip())
            elif isinstance(item, str) and item.strip():
                res.add(item.strip())
        return list(res)

workout_repository = WorkoutRepository()

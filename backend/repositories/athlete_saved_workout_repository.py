from database import mongodb


class AthleteSavedWorkoutRepository:
    def __init__(self):
        self._collection = None

    @property
    def collection(self):
        if self._collection is not None:
            return self._collection
        try:
            from routes import athlete_saved_workout_routes
            if hasattr(athlete_saved_workout_routes, "athlete_saved_workouts_collection"):
                return athlete_saved_workout_routes.athlete_saved_workouts_collection
        except ImportError:
            pass
        return mongodb.athlete_saved_workouts_collection

    @collection.setter
    def collection(self, value):
        self._collection = value

    async def create(self, doc: dict) -> dict:
        await self.collection.insert_one(doc)
        return doc

    async def find_by_athlete_and_template(self, athlete_id: str, workout_template_id: str):
        return await self.collection.find_one({
            "athlete_id": athlete_id,
            "workout_template_id": workout_template_id,
        })

    async def find_by_athlete(self, athlete_id: str):
        cursor = self.collection.find({"athlete_id": athlete_id}).sort("created_at", -1)
        return await cursor.to_list(length=1000)

    async def delete_by_athlete_and_template(self, athlete_id: str, workout_template_id: str) -> int:
        res = await self.collection.delete_one({
            "athlete_id": athlete_id,
            "workout_template_id": workout_template_id,
        })
        return res.deleted_count


athlete_saved_workout_repository = AthleteSavedWorkoutRepository()

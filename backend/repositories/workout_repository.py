from database import mongodb

class WorkoutRepository:
    @property
    def collection(self):
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

    async def create(self, workout_data: dict) -> dict:
        await self.collection.insert_one(workout_data)
        return workout_data

    async def get_by_coach(self, coach_id: str) -> list:
        workouts = []
        async for w in self.collection.find({"coach_id": coach_id}):
            workouts.append(w)
        return workouts

    async def get_by_athlete(self, athlete_id: str) -> list:
        workouts = []
        async for w in self.collection.find({"athlete_id": athlete_id}):
            workouts.append(w)
        return workouts

    async def find_by_workout_id(self, workout_id: str) -> dict | None:
        return await self.collection.find_one({"workout_id": workout_id})

    async def update_status(self, workout_id: str, status: str):
        return await self.collection.update_one(
            {"workout_id": workout_id},
            {"$set": {"status": status}}
        )

workout_repository = WorkoutRepository()

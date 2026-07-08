from database import mongodb

class PerformanceRepository:
    @property
    def collection(self):
        try:
            from routes import performance_routes
            if hasattr(performance_routes, "performance_collection"):
                return performance_routes.performance_collection
        except ImportError:
            pass
        try:
            from services import performance_service
            if hasattr(performance_service, "performance_collection"):
                return performance_service.performance_collection
        except ImportError:
            pass
        return mongodb.performance_collection

    async def create(self, performance_data: dict) -> dict:
        await self.collection.insert_one(performance_data)
        return performance_data

    async def get_by_athlete(self, athlete_id: str) -> list:
        records = []
        async for perf in self.collection.find({"athlete_id": athlete_id}):
            records.append(perf)
        return records

performance_repository = PerformanceRepository()

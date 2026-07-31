from database import mongodb

class AthleteRepository:
    def __init__(self):
        self._collection = None

    @property
    def collection(self):
        if self._collection is not None:
            return self._collection
        return mongodb.athletes_collection

    @collection.setter
    def collection(self, value):
        self._collection = value


    async def register(self, athlete_data: dict) -> dict:
        await self.collection.insert_one(athlete_data)
        return athlete_data

    async def get_all(self) -> list:
        athletes = []
        async for athlete in self.collection.find():
            athletes.append(athlete)
        return athletes

    async def find_by_id(self, athlete_id: str) -> dict | None:
        return await self.collection.find_one({"athlete_id": athlete_id})

    async def update_weight(self, name: str, weight: int):
        return await self.collection.update_one(
            {"name": name},
            {"$set": {"weight": weight}}
        )

    async def delete_all(self):
        return await self.collection.delete_many({})

    async def assign_coach(self, athlete_id: str, coach_id: str):
        return await self.collection.update_one(
            {"athlete_id": athlete_id},
            {"$set": {"coach_id": coach_id}},
        )

athlete_repository = AthleteRepository()

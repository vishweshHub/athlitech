"""
AthliTech Athlete Repository.

Provides data access methods for managing athletes collection.
"""

from typing import List, Optional, Dict, Any
from database import mongodb
from database.utils import fetch_cursor_list


class AthleteRepository:
    """Repository handling CRUD operations for athlete documents."""

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
        """Registers a new athlete document."""
        await self.collection.insert_one(athlete_data)
        return athlete_data

    async def get_all(self) -> List[Dict[str, Any]]:
        """Retrieves all athlete documents."""
        cursor = self.collection.find()
        return await fetch_cursor_list(cursor)

    async def find_by_id(self, athlete_id: str) -> Optional[Dict[str, Any]]:
        """Finds athlete by athlete_id, account_id, owner_account_id, or owner_id string."""
        ath = await self.collection.find_one({"athlete_id": athlete_id})
        if ath:
            return ath
        ath = await self.collection.find_one({"account_id": athlete_id})
        if ath:
            return ath
        ath = await self.collection.find_one({"owner_account_id": athlete_id})
        if ath:
            return ath
        return await self.collection.find_one({"owner_id": athlete_id})

    async def update_weight(self, name: str, weight: int):
        """Updates athlete weight field by name."""
        return await self.collection.update_one(
            {"name": name},
            {"$set": {"weight": weight}}
        )

    async def delete_all(self):
        """Deletes all athlete documents (used in test/seed setups)."""
        return await self.collection.delete_many({})

    async def assign_coach(self, athlete_id: str, coach_id: str):
        """Assigns a coach_id to an athlete document."""
        return await self.collection.update_one(
            {"athlete_id": athlete_id},
            {"$set": {"coach_id": coach_id}},
        )


athlete_repository = AthleteRepository()


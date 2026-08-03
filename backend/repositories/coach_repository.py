"""
AthliTech Coach Repository.

Provides data access methods for querying coach documents.
"""

from typing import Optional, Dict, Any
from database import mongodb
from database.utils import to_object_id


class CoachRepository:
    """Repository handling CRUD operations for coach user records."""

    @property
    def collection(self):
        return mongodb.users_collection

    async def find_by_coach_id(self, coach_id: str) -> Optional[Dict[str, Any]]:
        """Finds coach user by unique coach_id string."""
        return await self.collection.find_one({"coach_id": coach_id})

    async def find_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Finds coach user by user ObjectId string."""
        oid = to_object_id(user_id)
        if not oid:
            return None
        return await self.collection.find_one({"_id": oid})


coach_repository = CoachRepository()


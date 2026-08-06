"""
AthliTech Profile Repository.

Provides data access methods for managing user profiles collection.
"""

from typing import Optional, Dict, Any
from database.mongodb import db
from core.utils import get_utc_now
from core.constants import ROLE_ATHLETE
from database.utils import serialize_doc

profiles_collection = db["profiles"]


class ProfileRepository:
    """Repository handling CRUD operations for user profiles."""

    @property
    def collection(self):
        return profiles_collection

    def _format_doc(self, doc: Optional[dict]) -> Optional[dict]:
        if not doc:
            return None
        formatted = dict(doc)
        if "_id" in formatted:
            formatted["id"] = str(formatted.pop("_id"))
        return formatted

    async def get_profile_by_user_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves profile document formatted with string id by user_id."""
        doc = await self.collection.find_one({"user_id": user_id})
        return self._format_doc(doc)

    async def save_profile(self, user_id: str, role: str, profile_data: dict) -> Dict[str, Any]:
        """Creates or updates a profile document for an athlete or coach."""
        now = get_utc_now()
        existing = await self.get_profile_by_user_id(user_id)

        doc_key = "athlete_data" if role == ROLE_ATHLETE else "coach_data"

        if existing:
            update_fields = {
                doc_key: profile_data,
                "role": role,
                "updated_at": now,
            }
            await self.collection.update_one(
                {"user_id": user_id},
                {"$set": update_fields}
            )
            return await self.get_profile_by_user_id(user_id)
        else:
            new_doc = {
                "user_id": user_id,
                "role": role,
                doc_key: profile_data,
                "visibility": {
                    "bio_is_public": False,
                    "stats_is_public": False,
                },
                "created_at": now,
                "updated_at": now,
            }
            await self.collection.insert_one(new_doc)
            return self._format_doc(new_doc)


profile_repository = ProfileRepository()



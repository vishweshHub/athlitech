"""
AthliTech Role Profile Repository.

Provides data access methods for managing role profiles collection.
"""

from typing import Optional, Dict, Any, List
from database.mongodb import role_profiles_collection


class RoleProfileRepository:
    """Repository handling CRUD operations for role profile documents."""

    @property
    def collection(self):
        return role_profiles_collection

    def _format_doc(self, doc: Optional[dict]) -> Optional[dict]:
        if not doc:
            return None
        formatted = dict(doc)
        if "_id" in formatted:
            formatted["id"] = str(formatted.pop("_id"))
        return formatted

    async def get_by_role_profile_id(self, role_profile_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves a role profile by role_profile_id."""
        doc = await self.collection.find_one({"role_profile_id": role_profile_id})
        return self._format_doc(doc)

    async def get_by_account_and_type(self, account_id: str, profile_type: str) -> Optional[Dict[str, Any]]:
        """Retrieves a role profile matching account_id and profile_type."""
        doc = await self.collection.find_one({"account_id": account_id, "profile_type": profile_type})
        return self._format_doc(doc)

    async def create_role_profile(self, role_profile_data: dict) -> Dict[str, Any]:
        """Creates a new role profile document."""
        await self.collection.insert_one(role_profile_data)
        return self._format_doc(role_profile_data)

    async def update_role_profile(self, role_profile_id: str, update_fields: dict) -> Optional[Dict[str, Any]]:
        """Updates fields on a role profile document."""
        await self.collection.update_one(
            {"role_profile_id": role_profile_id},
            {"$set": update_fields}
        )
        return await self.get_by_role_profile_id(role_profile_id)


role_profile_repository = RoleProfileRepository()

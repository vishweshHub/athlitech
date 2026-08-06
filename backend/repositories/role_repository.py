"""
AthliTech Role Repository.

Provides data access methods for managing roles collection.
"""

from typing import List, Optional, Dict, Any
from database import mongodb
from database.utils import fetch_cursor_list


class RoleRepository:
    """Repository handling CRUD operations for user roles."""

    @property
    def collection(self):
        try:
            from services import role_service
            if hasattr(role_service, "roles_collection"):
                return role_service.roles_collection
        except ImportError:
            pass
        return mongodb.roles_collection

    async def find_by_name(self, name: str) -> Optional[Dict[str, Any]]:
        """Finds a role by string name."""
        return await self.collection.find_one({"name": name})

    async def create(self, role_data: dict) -> dict:
        """Creates a new role document."""
        await self.collection.insert_one(role_data)
        return role_data

    async def get_all(self) -> List[Dict[str, Any]]:
        """Retrieves all role documents."""
        cursor = self.collection.find()
        return await fetch_cursor_list(cursor)


role_repository = RoleRepository()


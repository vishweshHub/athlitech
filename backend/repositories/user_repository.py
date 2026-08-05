"""
AthliTech User Repository.

Provides data access methods for managing users collection.
"""

from typing import List, Optional, Dict, Any
from database import mongodb
from database.utils import to_object_id, fetch_cursor_list
from core.constants import DEFAULT_PAGE_SKIP, DEFAULT_PAGE_LIMIT


class UserRepository:
    """Repository handling CRUD operations for user documents."""

    @property
    def collection(self):
        try:
            from services import user_service
            if hasattr(user_service, "users_collection"):
                return user_service.users_collection
        except ImportError:
            pass
        return mongodb.users_collection

    async def get_all_users(
        self,
        skip: int = DEFAULT_PAGE_SKIP,
        limit: int = DEFAULT_PAGE_LIMIT,
        role: Optional[str] = None,
        search: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Retrieves users with optional role filtering and name/email search.

        Args:
            skip (int): Records to skip.
            limit (int): Max records to return.
            role (Optional[str]): Role filter.
            search (Optional[str]): Case-insensitive search string.
            user_ids (Optional[List[str]]): List of user IDs to filter by.

        Returns:
            List[Dict[str, Any]]: List of matching user documents.
        """
        query: Dict[str, Any] = {}
        if user_ids is not None:
            oids = [to_object_id(uid) for uid in user_ids if to_object_id(uid)]
            query["$or"] = [{"_id": {"$in": oids}}, {"id": {"$in": user_ids}}, {"account_id": {"$in": user_ids}}]
        if role:
            query["role"] = role
        if search:
            search_clause = [
                {"name": {"$regex": search, "$options": "i"}},
                {"email": {"$regex": search, "$options": "i"}}
            ]
            if "$or" in query:
                query = {"$and": [{"$or": query["$or"]}, {"$or": search_clause}]}
            else:
                query["$or"] = search_clause
        cursor = self.collection.find(query)
        return await fetch_cursor_list(cursor, skip, limit)

    async def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Finds a user document by string ID or ObjectId string.

        Args:
            user_id (str): User ObjectId string.

        Returns:
            Optional[Dict[str, Any]]: User document or None.
        """
        oid = to_object_id(user_id)
        if not oid:
            return None
        return await self.collection.find_one({"_id": oid})

    async def find_role_by_name(self, role_name: str) -> Optional[Dict[str, Any]]:
        """
        Finds a role document by role name.

        Args:
            role_name (str): Name of the role.

        Returns:
            Optional[Dict[str, Any]]: Role document or None.
        """
        try:
            from services import user_service
            if hasattr(user_service, "roles_collection"):
                return await user_service.roles_collection.find_one({"name": role_name})
        except ImportError:
            pass
        return await mongodb.roles_collection.find_one({"name": role_name})

    async def update_user_role(self, user_id: str, role_name: str) -> Optional[Dict[str, Any]]:
        """
        Updates a user's role string.

        Args:
            user_id (str): User ID string.
            role_name (str): New role name.

        Returns:
            Optional[Dict[str, Any]]: Updated user document or None.
        """
        oid = to_object_id(user_id)
        if not oid:
            return None
        result = await self.collection.update_one(
            {"_id": oid},
            {"$set": {"role": role_name}}
        )
        if result.matched_count == 0:
            return None
        return await self.collection.find_one({"_id": oid})

    async def delete_user_by_id(self, user_id: str) -> bool:
        """
        Deletes a user by ID.

        Args:
            user_id (str): User ID string.

        Returns:
            bool: True if deleted, False otherwise.
        """
        oid = to_object_id(user_id)
        if not oid:
            return False
        result = await self.collection.delete_one({"_id": oid})
        return result.deleted_count > 0


user_repository = UserRepository()


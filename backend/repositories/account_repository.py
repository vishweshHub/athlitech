"""
AthliTech Account Repository.

Provides data access methods for managing accounts collection.
"""

from typing import Optional, Dict, Any, List
from database.mongodb import accounts_collection
from database.utils import to_object_id, fetch_cursor_list
from core.constants import DEFAULT_PAGE_SKIP, DEFAULT_PAGE_LIMIT


class AccountRepository:
    """Repository handling CRUD operations for account documents."""

    @property
    def collection(self):
        return accounts_collection

    def _format_doc(self, doc: Optional[dict]) -> Optional[dict]:
        if not doc:
            return None
        formatted = dict(doc)
        if "_id" in formatted:
            formatted["id"] = str(formatted.pop("_id"))
        return formatted

    async def get_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Retrieves account by lowercased email."""
        doc = await self.collection.find_one({"email": email.lower()})
        return self._format_doc(doc)

    async def get_by_account_id(self, account_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves account by account_id string or ObjectId string."""
        doc = await self.collection.find_one({"account_id": account_id})
        if not doc:
            oid = to_object_id(account_id)
            if oid:
                doc = await self.collection.find_one({"_id": oid})
        return self._format_doc(doc)

    async def create_account(self, account_data: dict) -> Dict[str, Any]:
        """Creates a new account document."""
        await self.collection.insert_one(account_data)
        return self._format_doc(account_data)

    async def update_account(self, account_id: str, update_fields: dict) -> Optional[Dict[str, Any]]:
        """Updates fields on an account document."""
        oid = to_object_id(account_id)
        query = {"account_id": account_id} if not oid else {"$or": [{"account_id": account_id}, {"_id": oid}]}
        await self.collection.update_one(query, {"$set": update_fields})
        return await self.get_by_account_id(account_id)


account_repository = AccountRepository()

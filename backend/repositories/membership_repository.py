"""
AthliTech Membership Repository.

Provides data access methods for managing memberships collection.
"""

from typing import Optional, Dict, Any, List
from database.mongodb import memberships_collection
from database.utils import fetch_cursor_list
from core.constants import DEFAULT_PAGE_SKIP, DEFAULT_PAGE_LIMIT


class MembershipRepository:
    """Repository handling CRUD operations for tenant membership documents."""

    @property
    def collection(self):
        return memberships_collection

    def _format_doc(self, doc: Optional[dict]) -> Optional[dict]:
        if not doc:
            return None
        formatted = dict(doc)
        if "_id" in formatted:
            formatted["id"] = str(formatted.pop("_id"))
        return formatted

    async def get_by_membership_id(self, membership_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves membership by membership_id string."""
        doc = await self.collection.find_one({"membership_id": membership_id})
        return self._format_doc(doc)

    async def get_memberships_by_account(self, account_id: str) -> List[Dict[str, Any]]:
        """Retrieves all active memberships for a user account."""
        cursor = self.collection.find({"account_id": account_id})
        docs = await cursor.to_list(length=100)
        return [self._format_doc(d) for d in docs]

    async def get_memberships_by_org(
        self,
        organization_id: str,
        role: Optional[str] = None,
        skip: int = DEFAULT_PAGE_SKIP,
        limit: int = DEFAULT_PAGE_LIMIT
    ) -> List[Dict[str, Any]]:
        """Lists memberships within an organization with optional role filtering."""
        query = {"organization_id": organization_id}
        if role:
            query["role"] = role
        cursor = self.collection.find(query)
        docs = await fetch_cursor_list(cursor, skip, limit)
        return [self._format_doc(d) for d in docs]

    async def create_membership(self, membership_data: dict) -> Dict[str, Any]:
        """Creates a new membership record."""
        await self.collection.insert_one(membership_data)
        return self._format_doc(membership_data)

    async def assign_coach(self, membership_id: str, coach_membership_id: Optional[str]) -> Optional[Dict[str, Any]]:
        """Assigns or unassigns a coach membership to an athlete membership."""
        await self.collection.update_one(
            {"membership_id": membership_id},
            {"$set": {"assigned_coach_membership_id": coach_membership_id}}
        )
        return await self.get_by_membership_id(membership_id)


membership_repository = MembershipRepository()

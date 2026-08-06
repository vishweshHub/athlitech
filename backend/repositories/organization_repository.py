"""
AthliTech Organization Repository.

Provides data access methods for managing organizations collection.
"""

from typing import Optional, Dict, Any, List
from database.mongodb import organizations_collection
from database.utils import fetch_cursor_list
from core.constants import DEFAULT_PAGE_SKIP, DEFAULT_PAGE_LIMIT


class OrganizationRepository:
    """Repository handling CRUD operations for organization documents."""

    @property
    def collection(self):
        return organizations_collection

    def _format_doc(self, doc: Optional[dict]) -> Optional[dict]:
        if not doc:
            return None
        formatted = dict(doc)
        if "_id" in formatted:
            formatted["id"] = str(formatted.pop("_id"))
        return formatted

    async def get_by_org_id(self, organization_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves organization by organization_id."""
        doc = await self.collection.find_one({"organization_id": organization_id})
        return self._format_doc(doc)

    async def get_by_slug(self, slug: str) -> Optional[Dict[str, Any]]:
        """Retrieves organization by unique slug."""
        doc = await self.collection.find_one({"slug": slug.lower()})
        return self._format_doc(doc)

    async def create_organization(self, org_data: dict) -> Dict[str, Any]:
        """Creates a new organization document."""
        await self.collection.insert_one(org_data)
        return self._format_doc(org_data)

    async def list_organizations(
        self,
        skip: int = DEFAULT_PAGE_SKIP,
        limit: int = DEFAULT_PAGE_LIMIT
    ) -> List[Dict[str, Any]]:
        """Lists all organizations with pagination."""
        cursor = self.collection.find()
        docs = await fetch_cursor_list(cursor, skip, limit)
        return [self._format_doc(d) for d in docs]


organization_repository = OrganizationRepository()

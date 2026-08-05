"""
AthliTech Workout Repository.

Provides data access methods for managing workout templates and legacy workout documents.
"""

from typing import List, Optional, Dict, Any, Set
from database import mongodb
from database.utils import to_object_id, fetch_cursor_list
from core.constants import DEFAULT_PAGE_SKIP, DEFAULT_PAGE_LIMIT


class WorkoutRepository:
    """Repository handling CRUD operations for workouts collection."""

    def __init__(self):
        self._collection = None

    @property
    def collection(self):
        if self._collection is not None:
            return self._collection
        return mongodb.workouts_collection

    @collection.setter
    def collection(self, value):
        self._collection = value

    def _build_id_query(self, workout_id: str) -> Dict[str, Any]:
        """Builds query matching either string 'id', 'workout_id', or BSON '_id'."""
        query: Dict[str, Any] = {"$or": [{"id": workout_id}, {"workout_id": workout_id}]}
        oid = to_object_id(workout_id)
        if oid:
            query["$or"].append({"_id": oid})
        return query

    async def create_template(self, workout_data: dict) -> dict:
        """Creates a new workout template document."""
        await self.collection.insert_one(workout_data)
        return workout_data

    async def get_templates(
        self,
        skip: int = DEFAULT_PAGE_SKIP,
        limit: int = DEFAULT_PAGE_LIMIT,
        sport: Optional[str] = None,
        category: Optional[str] = None,
        difficulty: Optional[str] = None,
        search: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Queries workout templates with optional filtering and search."""
        query: Dict[str, Any] = {"athlete_id": {"$exists": False}, "sport": {"$exists": True, "$ne": None}}
        if sport:
            query["sport"] = {"$regex": f"^{sport}$", "$options": "i"}
        if category:
            query["category"] = {"$regex": f"^{category}$", "$options": "i"}
        if difficulty:
            query["difficulty"] = {"$regex": f"^{difficulty}$", "$options": "i"}
        if search:
            query["$or"] = [
                {"title": {"$regex": search, "$options": "i"}},
                {"description": {"$regex": search, "$options": "i"}},
                {"sport": {"$regex": search, "$options": "i"}},
                {"category": {"$regex": search, "$options": "i"}},
                {"instructions": {"$regex": search, "$options": "i"}}
            ]

        cursor = self.collection.find(query)
        return await fetch_cursor_list(cursor, skip, limit)

    async def find_template_by_id(self, workout_id: str) -> Optional[Dict[str, Any]]:
        """Finds a workout template by any ID variant."""
        return await self.collection.find_one(self._build_id_query(workout_id))

    async def update_template(self, workout_id: str, update_data: dict) -> Optional[Dict[str, Any]]:
        """Updates a workout template and returns the updated document."""
        query = self._build_id_query(workout_id)
        result = await self.collection.update_one(query, {"$set": update_data})
        if result.matched_count == 0:
            return None
        return await self.collection.find_one(query)

    async def delete_template(self, workout_id: str) -> bool:
        """Deletes a workout template by ID."""
        query = self._build_id_query(workout_id)
        result = await self.collection.delete_one(query)
        return result.deleted_count > 0

    # Legacy Repository Methods
    async def create(self, workout_data: dict) -> dict:
        """Legacy workout creation."""
        await self.collection.insert_one(workout_data)
        return workout_data

    async def get_by_coach(
        self,
        coach_id: str,
        skip: int = DEFAULT_PAGE_SKIP,
        limit: int = DEFAULT_PAGE_LIMIT,
        status: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        if isinstance(coach_id, list):
            if len(coach_id) == 1:
                query: Dict[str, Any] = {"coach_id": coach_id[0]}
            else:
                query = {"coach_id": {"$in": coach_id}}
        else:
            query = {"coach_id": coach_id}
        if status:
            query["status"] = status
        cursor = self.collection.find(query)
        return await fetch_cursor_list(cursor, skip, limit)

    async def get_by_athlete(
        self,
        athlete_id: str,
        skip: int = DEFAULT_PAGE_SKIP,
        limit: int = DEFAULT_PAGE_LIMIT,
        status: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Fetches legacy workouts assigned to an athlete."""
        query: Dict[str, Any] = {"athlete_id": athlete_id}
        if status:
            query["status"] = status
        cursor = self.collection.find(query)
        return await fetch_cursor_list(cursor, skip, limit)

    async def find_by_workout_id(self, workout_id: str) -> Optional[Dict[str, Any]]:
        """Finds legacy workout by workout_id string."""
        return await self.collection.find_one({"workout_id": workout_id})

    async def update_status(
        self,
        workout_id: str,
        status: str,
        completed_at: Optional[str] = None,
        completion_percentage: Optional[int] = None,
        athlete_notes: Optional[str] = None
    ):
        """Updates legacy workout completion status."""
        update_data: Dict[str, Any] = {"status": status}
        if completed_at is not None:
            update_data["completed_at"] = completed_at
        if completion_percentage is not None:
            update_data["completion_percentage"] = completion_percentage
        if athlete_notes is not None:
            update_data["athlete_notes"] = athlete_notes
        return await self.collection.update_one(
            {"workout_id": workout_id},
            {"$set": update_data}
        )

    async def get_distinct_sports(self) -> List[str]:
        """Gets sorted list of distinct sports across templates."""
        distinct_sports = await self.collection.distinct("sport", {"sport": {"$exists": True, "$ne": None}})
        return [s for s in distinct_sports if s and isinstance(s, str) and s.strip()]

    async def get_distinct_categories(self) -> List[str]:
        """Gets sorted list of distinct categories across templates."""
        distinct_cats = await self.collection.distinct("category", {"category": {"$exists": True, "$ne": None}})
        return [c for c in distinct_cats if c and isinstance(c, str) and c.strip()]

    async def get_distinct_difficulties(self) -> List[str]:
        """Gets sorted list of distinct difficulty levels."""
        distinct_diffs = await self.collection.distinct("difficulty", {"difficulty": {"$exists": True, "$ne": None}})
        return [d for d in distinct_diffs if d and isinstance(d, str) and d.strip()]

    async def get_distinct_equipment(self) -> List[str]:
        """Gets sorted list of distinct equipment items."""
        distinct_eq = await self.collection.distinct("equipment", {"equipment": {"$exists": True, "$ne": None}})
        res: Set[str] = set()
        for item in distinct_eq:
            if isinstance(item, list):
                for sub in item:
                    if sub and isinstance(sub, str):
                        res.add(sub.strip())
            elif isinstance(item, str) and item.strip():
                res.add(item.strip())
        return list(res)


workout_repository = WorkoutRepository()


"""
AthliTech MongoDB Helper Utilities.

Provides reusable helpers for safe ObjectId parsing, document serialization,
and async cursor pagination across repositories.
"""

from typing import Any, Dict, List, Optional
from bson import ObjectId


def to_object_id(id_val: Any) -> Optional[ObjectId]:
    """
    Safely converts a string to a BSON ObjectId.
    Returns None if the value is invalid or already None.

    Args:
        id_val (Any): String or ObjectId.

    Returns:
        Optional[ObjectId]: BSON ObjectId if valid, else None.
    """
    if not id_val:
        return None
    if isinstance(id_val, ObjectId):
        return id_val
    if isinstance(id_val, str) and ObjectId.is_valid(id_val):
        return ObjectId(id_val)
    return None


def serialize_doc(doc: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """
    Converts a MongoDB document dict's '_id' field to string representation.

    Args:
        doc (Optional[Dict[str, Any]]): MongoDB document dict.

    Returns:
        Optional[Dict[str, Any]]: Document dict with _id converted to str, or None.
    """
    if doc is None:
        return None
    result = dict(doc)
    if "_id" in result and isinstance(result["_id"], ObjectId):
        result["_id"] = str(result["_id"])
    return result


async def fetch_cursor_list(cursor: Any, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
    """
    Applies skip/limit to an AsyncIOMotorCursor and fetches all matching documents as a list.

    Args:
        cursor (Any): AsyncIOMotorCursor query object.
        skip (int): Records to skip.
        limit (int): Maximum records to fetch.

    Returns:
        List[Dict[str, Any]]: List of document dictionaries.
    """
    if hasattr(cursor, "skip"):
        cursor = cursor.skip(skip)
    if hasattr(cursor, "limit"):
        cursor = cursor.limit(limit)

    items: List[Dict[str, Any]] = []
    async for item in cursor:
        items.append(item)
    return items

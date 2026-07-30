from fastapi import APIRouter, Depends, Query
from typing import Optional

from services.auth_service import get_current_user
from schemas.activity_feed_schema import ActivityFeedResponse
from services.activity_feed_service import get_athlete_activity_feed

router = APIRouter(prefix="/activity-feed", tags=["Activity Feed"])


@router.get("", response_model=ActivityFeedResponse, summary="Get Athlete Activity Feed")
@router.get("/", response_model=ActivityFeedResponse, summary="Get Athlete Activity Feed")
async def get_activity_feed_route(
    athlete_id: Optional[str] = Query(None, description="Target athlete ID (for Coaches and Admins)"),
    cursor: Optional[str] = Query(None, description="Cursor for pagination (ISO timestamp)"),
    limit: int = Query(10, ge=1, le=30, description="Page limit (max 30)"),
    current_user: dict = Depends(get_current_user),
):
    return await get_athlete_activity_feed(
        current_user=current_user,
        athlete_id=athlete_id,
        cursor=cursor,
        limit=limit,
    )

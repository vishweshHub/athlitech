from fastapi import APIRouter, Depends
from typing import List

from services.auth_service import get_current_user
from schemas.session_schema import (
    SessionCreate,
    SessionUpdate,
    SessionResponse,
)
from services.session_service import (
    create_session,
    get_sessions_for_day,
    get_session_by_id,
    update_session,
    delete_session,
)

router = APIRouter(prefix="/training-plans", tags=["Sessions"])


@router.post("/sessions/", response_model=SessionResponse, summary="Create Session")
async def create_session_route(
    payload: SessionCreate,
    current_user: dict = Depends(get_current_user),
):
    return await create_session(payload, current_user)


@router.get("/days/{day_id}/sessions", response_model=List[SessionResponse], summary="Get Sessions for Training Day")
async def get_day_sessions_route(
    day_id: str,
    current_user: dict = Depends(get_current_user),
):
    return await get_sessions_for_day(day_id, current_user)


@router.get("/sessions/{session_id}", response_model=SessionResponse, summary="Get Session by ID")
async def get_session_by_id_route(
    session_id: str,
    current_user: dict = Depends(get_current_user),
):
    return await get_session_by_id(session_id, current_user)


@router.put("/sessions/{session_id}", response_model=SessionResponse, summary="Update Session")
async def update_session_route(
    session_id: str,
    payload: SessionUpdate,
    current_user: dict = Depends(get_current_user),
):
    return await update_session(session_id, payload, current_user)


@router.delete("/sessions/{session_id}", summary="Delete Session")
async def delete_session_route(
    session_id: str,
    current_user: dict = Depends(get_current_user),
):
    return await delete_session(session_id, current_user)

import uuid
from datetime import datetime
from typing import List
from fastapi import HTTPException

from repositories.workout_assignment_repository import workout_assignment_repository
from repositories.session_repository import session_repository
from repositories.training_plan_repository import training_plan_repository
from repositories.workout_repository import workout_repository
from services.training_plan_service import _verify_plan_access
from schemas.workout_assignment_schema import (
    WorkoutAssignmentCreate,
    WorkoutAssignmentUpdate,
    WorkoutAssignmentResponse,
)


def _format_assignment_response(a: dict) -> WorkoutAssignmentResponse:
    assignment_id = str(a.get("id") or a.get("_id"))
    return WorkoutAssignmentResponse(
        id=assignment_id,
        session_id=str(a.get("session_id", "")),
        workout_template_id=str(a.get("workout_template_id", "")),
        category=str(a.get("category", "main")),
        order=int(a.get("order", 1)),
        assignment_note=a.get("assignment_note"),
        overrides=a.get("overrides") or {},
        created_at=a.get("created_at") if isinstance(a.get("created_at"), datetime) else datetime.utcnow(),
        updated_at=a.get("updated_at") if isinstance(a.get("updated_at"), datetime) else datetime.utcnow(),
    )


async def _verify_session_access(session_id: str, current_user: dict, require_write: bool = False) -> dict:
    session = await session_repository.find_session_by_id(session_id)
    if not session:
        raise HTTPException(status_code=404, detail=f"Session with ID '{session_id}' does not exist")
    day = await training_plan_repository.find_day_by_id(session.get("training_day_id"))
    if day:
        week = await training_plan_repository.find_week_by_id(day.get("training_week_id"))
        if week:
            plan = await training_plan_repository.find_plan_by_id(week.get("training_plan_id"))
            if plan:
                await _verify_plan_access(plan, current_user, require_write=require_write)
    return session


async def create_assignment(payload: WorkoutAssignmentCreate, current_user: dict) -> WorkoutAssignmentResponse:
    await _verify_session_access(payload.session_id, current_user, require_write=True)

    # Validate Workout Template exists
    template = await workout_repository.find_template_by_id(payload.workout_template_id)
    if not template:
        raise HTTPException(
            status_code=404,
            detail=f"Workout Template with ID '{payload.workout_template_id}' does not exist"
        )

    # Prevent duplicate order values within the same Session
    existing = await workout_assignment_repository.find_assignment_by_session_and_order(payload.session_id, payload.order)
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Workout Assignment with order {payload.order} already exists for this Session"
        )

    assignment_doc = {
        "id": str(uuid.uuid4()),
        "session_id": payload.session_id,
        "workout_template_id": payload.workout_template_id,
        "category": payload.category.value,
        "order": payload.order,
        "assignment_note": payload.assignment_note,
        "overrides": payload.overrides or {},
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }

    created = await workout_assignment_repository.create_assignment(assignment_doc)
    return _format_assignment_response(created)


async def get_assignments_for_session(session_id: str, current_user: dict) -> List[WorkoutAssignmentResponse]:
    await _verify_session_access(session_id, current_user, require_write=False)
    assignments = await workout_assignment_repository.get_assignments_by_session(session_id)
    return [_format_assignment_response(a) for a in assignments]


async def get_assignment_by_id(assignment_id: str, current_user: dict) -> WorkoutAssignmentResponse:
    assignment = await workout_assignment_repository.find_assignment_by_id(assignment_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Workout Assignment not found")
    await _verify_session_access(assignment.get("session_id"), current_user, require_write=False)
    return _format_assignment_response(assignment)


async def update_assignment(assignment_id: str, payload: WorkoutAssignmentUpdate, current_user: dict) -> WorkoutAssignmentResponse:
    assignment = await workout_assignment_repository.find_assignment_by_id(assignment_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Workout Assignment not found")

    await _verify_session_access(assignment.get("session_id"), current_user, require_write=True)

    changes = payload.model_dump(exclude_unset=True)
    if not changes:
        return _format_assignment_response(assignment)

    if "category" in changes and hasattr(changes["category"], "value"):
        changes["category"] = changes["category"].value

    if "order" in changes and changes["order"] != assignment.get("order"):
        existing = await workout_assignment_repository.find_assignment_by_session_and_order(
            assignment.get("session_id"), changes["order"]
        )
        if existing and str(existing.get("id") or existing.get("_id")) != assignment_id:
            raise HTTPException(
                status_code=400,
                detail=f"Workout Assignment with order {changes['order']} already exists for this Session"
            )

    changes["updated_at"] = datetime.utcnow()
    updated = await workout_assignment_repository.update_assignment(assignment_id, changes)
    return _format_assignment_response(updated)


async def delete_assignment(assignment_id: str, current_user: dict) -> dict:
    assignment = await workout_assignment_repository.find_assignment_by_id(assignment_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Workout Assignment not found")

    await _verify_session_access(assignment.get("session_id"), current_user, require_write=True)

    deleted = await workout_assignment_repository.delete_assignment(assignment_id)
    if not deleted:
        raise HTTPException(status_code=500, detail="Failed to delete workout assignment")
    return {"message": "Workout assignment deleted successfully", "id": assignment_id}

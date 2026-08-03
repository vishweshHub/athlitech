from uuid import uuid4
from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import HTTPException, status

from core.utils import get_utc_now
from core.constants import ROLE_ATHLETE
from repositories.athlete_saved_workout_repository import athlete_saved_workout_repository
from repositories.workout_repository import workout_repository
from schemas.athlete_saved_workout_schema import (
    AthleteSavedWorkoutCreate,
    AthleteSavedWorkoutResponse,
)


def _format_template_dict(template: Optional[dict]) -> Optional[Dict[str, Any]]:
    if not template:
        return None
    cleaned = dict(template)
    if "_id" in cleaned:
        cleaned["_id"] = str(cleaned["_id"])
    return cleaned


async def save_workout_for_athlete(
    payload: AthleteSavedWorkoutCreate,
    current_user: dict,
) -> AthleteSavedWorkoutResponse:
    user_role = current_user.get("role")
    if user_role != ROLE_ATHLETE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only athletes can save workouts to their personal collection.",
        )

    athlete_id = current_user.get("id") or str(current_user.get("_id"))
    template_id = payload.workout_template_id

    # Validate workout template exists
    template = await workout_repository.find_template_by_id(template_id)
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workout template not found.",
        )

    # Check duplicate prevention
    existing = await athlete_saved_workout_repository.find_by_athlete_and_template(
        athlete_id=athlete_id,
        workout_template_id=template_id,
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Workout template already saved in collection.",
        )

    doc_id = str(uuid4())
    now = get_utc_now()
    doc = {
        "id": doc_id,
        "athlete_id": athlete_id,
        "workout_template_id": template_id,
        "created_at": now,
    }

    await athlete_saved_workout_repository.create(doc)

    formatted_template = _format_template_dict(template)

    return AthleteSavedWorkoutResponse(
        id=doc_id,
        athlete_id=athlete_id,
        workout_template_id=template_id,
        created_at=now,
        workout_template=formatted_template,
    )


async def get_saved_workouts_for_athlete(
    current_user: dict,
    target_athlete_id: Optional[str] = None,
) -> List[AthleteSavedWorkoutResponse]:
    user_role = current_user.get("role")
    current_id = current_user.get("id") or str(current_user.get("_id"))

    if user_role == "coach":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Coaches do not have access to athlete saved workout collections.",
        )

    if user_role == "athlete":
        if target_athlete_id and target_athlete_id != current_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Athletes can only view their own saved workouts.",
            )
        athlete_id = current_id
    elif user_role == "admin":
        athlete_id = target_athlete_id or current_id
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized access.",
        )

    saved_docs = await athlete_saved_workout_repository.find_by_athlete(athlete_id)

    results: List[AthleteSavedWorkoutResponse] = []
    for doc in saved_docs:
        template_id = doc.get("workout_template_id")
        template = await workout_repository.find_template_by_id(template_id)
        formatted_template = _format_template_dict(template)

        results.append(
            AthleteSavedWorkoutResponse(
                id=doc.get("id") or str(doc.get("_id")),
                athlete_id=doc.get("athlete_id"),
                workout_template_id=template_id,
                created_at=doc.get("created_at"),
                workout_template=formatted_template,
            )
        )

    return results


async def remove_saved_workout_for_athlete(
    workout_template_id: str,
    current_user: dict,
) -> dict:
    user_role = current_user.get("role")
    if user_role != "athlete":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only athletes can remove workouts from their personal collection.",
        )

    athlete_id = current_user.get("id") or str(current_user.get("_id"))

    deleted_count = await athlete_saved_workout_repository.delete_by_athlete_and_template(
        athlete_id=athlete_id,
        workout_template_id=workout_template_id,
    )

    if deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Saved workout not found in collection.",
        )

    return {
        "message": "Saved workout removed successfully.",
        "workout_template_id": workout_template_id,
    }

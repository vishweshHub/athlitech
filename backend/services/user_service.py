from bson import ObjectId
from fastapi import HTTPException

from core.permissions import normalize_role
from repositories.user_repository import user_repository
from schemas.user_schema import UserRead, UserRoleUpdate


async def get_all_users():
    users = await user_repository.get_all_users()
    return [
        UserRead(
            id=str(user["_id"]),
            name=user["name"],
            email=user["email"],
            role=normalize_role(user.get("role", "athlete")),
            coach_id=user.get("coach_id")
        )
        for user in users
    ]


async def get_user_by_id(user_id: str):
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="Invalid user id")

    user = await user_repository.get_user_by_id(user_id)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return UserRead(
        id=str(user["_id"]),
        name=user["name"],
        email=user["email"],
        role=normalize_role(user.get("role", "athlete")),
        coach_id=user.get("coach_id")
    )


async def update_user_role(user_id: str, role_update: UserRoleUpdate):
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="Invalid user id")

    role_name = normalize_role(role_update.role)
    role = await user_repository.find_role_by_name(role_name)
    if not role:
        raise HTTPException(status_code=400, detail="Role does not exist")

    user = await user_repository.update_user_role(user_id, role_name)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return UserRead(
        id=str(user["_id"]),
        name=user["name"],
        email=user["email"],
        role=normalize_role(user.get("role", "athlete")),
        coach_id=user.get("coach_id")
    )


async def delete_user_by_id(user_id: str):
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="Invalid user id")

    success = await user_repository.delete_user_by_id(user_id)

    if not success:
        raise HTTPException(status_code=404, detail="User not found")

    return {"message": "User deleted successfully"}

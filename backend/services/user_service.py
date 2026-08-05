from bson import ObjectId
from fastapi import HTTPException

from core.permissions import normalize_role
from repositories.user_repository import user_repository
from schemas.user_schema import UserRead, UserRoleUpdate


async def get_all_users(
    skip: int = 0,
    limit: int = 100,
    role: str | None = None,
    search: str | None = None,
    current_user_id: str | None = None
):
    org_user_ids = None
    if current_user_id:
        from database.mongodb import organizations_collection, memberships_collection
        org = await organizations_collection.find_one({"owner_account_id": current_user_id})
        if not org:
            mem = await memberships_collection.find_one({"account_id": current_user_id, "status": "active"})
            if mem and mem.get("organization_id"):
                org = await organizations_collection.find_one({"organization_id": mem["organization_id"]})
        if org:
            org_id = org.get("organization_id") or str(org.get("_id"))
            mems = await memberships_collection.find({"organization_id": org_id, "status": "active"}).to_list(1000)
            org_user_ids = [m["account_id"] for m in mems if m.get("account_id")]

    users = await user_repository.get_all_users(skip=skip, limit=limit, role=role, search=search, user_ids=org_user_ids)
    return [
        UserRead(
            id=str(user.get("id") or user.get("_id")),
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

    user = await user_repository.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    role = normalize_role(user.get("role", "athlete"))

    success = await user_repository.delete_user_by_id(user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")

    from database.mongodb import athletes_collection, workouts_collection, performance_collection
    if role == "athlete":
        # Deleting an athlete removes all coach assignments / deletes athlete profile records
        await athletes_collection.delete_many({"athlete_id": user_id})
        # Prevent orphan references by deleting their workouts and performance history
        await workouts_collection.delete_many({"athlete_id": user_id})
        await performance_collection.delete_many({"athlete_id": user_id})
    elif role == "coach":
        # Deleting a coach removes athlete assignments (sets coach_id to None)
        coach_id = user.get("coach_id") or user_id
        await athletes_collection.update_many(
            {"coach_id": coach_id},
            {"$set": {"coach_id": None}}
        )
        # Clear coach references from workouts and performance history
        await workouts_collection.update_many(
            {"coach_id": coach_id},
            {"$set": {"coach_id": None}}
        )
        await performance_collection.update_many(
            {"coach_id": coach_id},
            {"$set": {"coach_id": None}}
        )

    return {"message": "User deleted successfully"}

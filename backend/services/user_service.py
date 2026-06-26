from bson import ObjectId
from fastapi import HTTPException

from database.mongodb import users_collection, roles_collection
from schemas.user_schema import UserRead, UserRoleUpdate


async def get_all_users():
    users = []

    async for user in users_collection.find():
        users.append(UserRead(
            id=str(user["_id"]),
            name=user["name"],
            email=user["email"],
            role=user.get("role", "athlete")
        ))

    return users


async def get_user_by_id(user_id: str):
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="Invalid user id")

    user = await users_collection.find_one({"_id": ObjectId(user_id)})

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return UserRead(
        id=str(user["_id"]),
        name=user["name"],
        email=user["email"],
        role=user.get("role", "athlete")
    )


async def update_user_role(user_id: str, role_update: UserRoleUpdate):
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="Invalid user id")

    role_name = str(role_update.role)
    role = await roles_collection.find_one({"name": role_name})
    if not role:
        raise HTTPException(status_code=400, detail="Role does not exist")

    result = await users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"role": role_name}}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")

    user = await users_collection.find_one({"_id": ObjectId(user_id)})

    return UserRead(
        id=str(user["_id"]),
        name=user["name"],
        email=user["email"],
        role=user.get("role", "athlete")
    )

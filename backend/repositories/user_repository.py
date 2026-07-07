from bson import ObjectId
from database import mongodb

async def get_all_users() -> list:
    users = []
    async for user in mongodb.users_collection.find():
        users.append(user)
    return users

async def get_user_by_id(user_id: str) -> dict | None:
    return await mongodb.users_collection.find_one({"_id": ObjectId(user_id)})

async def find_role_by_name(role_name: str) -> dict | None:
    return await mongodb.roles_collection.find_one({"name": role_name})

async def update_user_role(user_id: str, role_name: str) -> dict | None:
    result = await mongodb.users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"role": role_name}}
    )
    if result.matched_count == 0:
        return None
    return await mongodb.users_collection.find_one({"_id": ObjectId(user_id)})

async def delete_user_by_id(user_id: str) -> bool:
    result = await mongodb.users_collection.delete_one({"_id": ObjectId(user_id)})
    return result.deleted_count > 0

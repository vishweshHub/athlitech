from bson import ObjectId
from database import mongodb

class UserRepository:
    @property
    def collection(self):
        try:
            from services import user_service
            if hasattr(user_service, "users_collection"):
                return user_service.users_collection
        except ImportError:
            pass
        return mongodb.users_collection

    async def get_all_users(self, skip: int = 0, limit: int = 100, role: str | None = None, search: str | None = None) -> list:
        query = {}
        if role:
            query["role"] = role
        if search:
            query["$or"] = [
                {"name": {"$regex": search, "$options": "i"}},
                {"email": {"$regex": search, "$options": "i"}}
            ]
        users = []
        async for user in self.collection.find(query).skip(skip).limit(limit):
            users.append(user)
        return users

    async def get_user_by_id(self, user_id: str) -> dict | None:
        return await self.collection.find_one({"_id": ObjectId(user_id)})

    async def find_role_by_name(self, role_name: str) -> dict | None:
        try:
            from services import user_service
            if hasattr(user_service, "roles_collection"):
                return await user_service.roles_collection.find_one({"name": role_name})
        except ImportError:
            pass
        return await mongodb.roles_collection.find_one({"name": role_name})

    async def update_user_role(self, user_id: str, role_name: str) -> dict | None:
        result = await self.collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"role": role_name}}
        )
        if result.matched_count == 0:
            return None
        return await self.collection.find_one({"_id": ObjectId(user_id)})

    async def delete_user_by_id(self, user_id: str) -> bool:
        result = await self.collection.delete_one({"_id": ObjectId(user_id)})
        return result.deleted_count > 0

user_repository = UserRepository()

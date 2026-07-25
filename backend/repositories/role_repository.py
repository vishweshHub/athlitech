from database import mongodb

class RoleRepository:
    @property
    def collection(self):
        try:
            from services import role_service
            if hasattr(role_service, "roles_collection"):
                return role_service.roles_collection
        except ImportError:
            pass
        return mongodb.roles_collection

    async def find_by_name(self, name: str) -> dict | None:
        return await self.collection.find_one({"name": name})

    async def create(self, role_data: dict) -> dict:
        await self.collection.insert_one(role_data)
        return role_data

    async def get_all(self) -> list:
        roles = []
        async for role in self.collection.find():
            roles.append(role)
        return roles

role_repository = RoleRepository()

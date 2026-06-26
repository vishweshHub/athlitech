from fastapi import HTTPException

from database.mongodb import roles_collection
from schemas.role_schema import RoleCreate


async def create_role(role: RoleCreate):
    existing_role = await roles_collection.find_one({"name": role.name})
    if existing_role:
        raise HTTPException(status_code=400, detail="Role already exists")

    await roles_collection.insert_one(role.dict())
    return {"message": "Role created successfully"}


async def get_all_roles():
    roles = []

    async for role in roles_collection.find():
        roles.append({
            "id": str(role["_id"]),
            "name": role["name"],
            "permissions": role.get("permissions", [])
        })

    return roles

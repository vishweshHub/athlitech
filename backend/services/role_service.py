from fastapi import HTTPException

from core.permissions import DEFAULT_ROLE_PERMISSIONS, normalize_role
from database.mongodb import roles_collection
from schemas.role_schema import RoleCreate


async def create_role(role: RoleCreate):
    role_name = normalize_role(role.name)
    existing_role = await roles_collection.find_one({"name": role_name})
    if existing_role:
        raise HTTPException(status_code=400, detail="Role already exists")

    permissions = [permission.strip() for permission in role.permissions if str(permission).strip()]

    await roles_collection.insert_one({
        "name": role_name,
        "permissions": permissions,
    })
    return {
        "message": "Role created successfully",
        "role": {
            "name": role_name,
            "permissions": permissions,
        },
    }


async def seed_default_roles():
    for role_name, permissions in DEFAULT_ROLE_PERMISSIONS.items():
        existing_role = await roles_collection.find_one({"name": role_name})
        if not existing_role:
            await roles_collection.insert_one({
                "name": role_name,
                "permissions": permissions,
            })


async def get_all_roles():
    roles = []

    async for role in roles_collection.find():
        name = normalize_role(role.get("name"))

        roles.append({
            "id": str(role["_id"]),
            "name": name,
            "permissions": role.get("permissions", [])
        })

    return roles

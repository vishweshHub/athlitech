from fastapi import HTTPException

from core.permissions import DEFAULT_ROLE_PERMISSIONS, normalize_role
from repositories.role_repository import role_repository
from schemas.role_schema import RoleCreate


async def create_role(role: RoleCreate):
    role_name = normalize_role(role.name)
    existing_role = await role_repository.find_by_name(role_name)
    if existing_role:
        raise HTTPException(status_code=400, detail="Role already exists")

    permissions = [permission.strip() for permission in role.permissions if str(permission).strip()]

    await role_repository.create({
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
        existing_role = await role_repository.find_by_name(role_name)
        if not existing_role:
            await role_repository.create({
                "name": role_name,
                "permissions": permissions,
            })


async def get_all_roles():
    roles = []

    all_roles = await role_repository.get_all()
    for role in all_roles:
        name = normalize_role(role.get("name"))

        roles.append({
            "id": str(role["_id"]),
            "name": name,
            "permissions": role.get("permissions", [])
        })

    return roles

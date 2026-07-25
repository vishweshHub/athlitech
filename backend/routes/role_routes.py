from fastapi import APIRouter, Depends, HTTPException
from typing import List

from schemas.role_schema import RoleCreate
from services.auth_service import get_current_user, require_admin
from services.role_service import create_role, get_all_roles

router = APIRouter(prefix="/roles", tags=["Roles"])


@router.post("/", dependencies=[Depends(require_admin)])
async def add_role(role: RoleCreate, current_user: dict = Depends(get_current_user)):
    return await create_role(role)


@router.get("/", dependencies=[Depends(require_admin)])
async def list_roles(current_user: dict = Depends(get_current_user)):
    return await get_all_roles()


@router.put("/{role_name}/permissions", dependencies=[Depends(require_admin)])
async def update_role_permissions(
    role_name: str,
    permissions: List[str],
    current_user: dict = Depends(get_current_user)
):
    role_name_norm = role_name.strip().lower()
    if role_name_norm in ["admin", "coach", "athlete"]:
        raise HTTPException(status_code=400, detail="Cannot edit permissions of default roles")

    from database.mongodb import roles_collection
    result = await roles_collection.update_one(
        {"name": role_name_norm},
        {"$set": {"permissions": [p.strip() for p in permissions if str(p).strip()]}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Role not found")
    return {"message": "Role permissions updated successfully"}


@router.delete("/{role_name}", dependencies=[Depends(require_admin)])
async def delete_role(
    role_name: str,
    current_user: dict = Depends(get_current_user)
):
    role_name_norm = role_name.strip().lower()
    if role_name_norm in ["admin", "coach", "athlete"]:
        raise HTTPException(status_code=400, detail="Cannot delete default roles")

    from database.mongodb import roles_collection
    result = await roles_collection.delete_one({"name": role_name_norm})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Role not found")
    return {"message": "Role deleted successfully"}

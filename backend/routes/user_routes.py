from fastapi import APIRouter, Depends, HTTPException

from schemas.user_schema import UserRoleUpdate
from services.auth_service import get_current_user, require_admin, require_admin_or_self
from services.user_service import get_all_users, get_user_by_id, update_user_role, delete_user_by_id

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/", dependencies=[Depends(require_admin)])
async def list_users(current_user: dict = Depends(get_current_user)):
    return await get_all_users()


@router.get("/{user_id}")
async def read_user(user_id: str, current_user: dict = Depends(require_admin_or_self)):
    return await get_user_by_id(user_id)


@router.put("/{user_id}/role", dependencies=[Depends(require_admin)])
async def change_user_role(
    user_id: str,
    role_update: UserRoleUpdate,
    current_user: dict = Depends(get_current_user)
):
    if user_id == current_user.get("id"):
        raise HTTPException(status_code=400, detail="Admins cannot change their own role")
    return await update_user_role(user_id, role_update)


@router.delete("/{user_id}", dependencies=[Depends(require_admin)])
async def delete_user(
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    if user_id == current_user.get("id"):
        raise HTTPException(status_code=400, detail="Admins cannot delete their own account")
    return await delete_user_by_id(user_id)

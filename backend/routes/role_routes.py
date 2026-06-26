from fastapi import APIRouter, Depends

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

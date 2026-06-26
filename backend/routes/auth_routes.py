from fastapi import APIRouter, Depends

from schemas.auth_schema import TokenResponse, UserLogin, UserRegister
from services.auth_service import get_current_user, login_user, register_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register")
async def register(user: UserRegister):
    return await register_user(user)


@router.post("/login", response_model=TokenResponse)
async def login(user: UserLogin):
    return await login_user(user)


@router.get("/me")
async def read_current_user(current_user: dict = Depends(get_current_user)):
    return current_user

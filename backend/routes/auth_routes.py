from fastapi import APIRouter, Depends, Cookie, HTTPException, Response

from schemas.auth_schema import TokenResponse, UserLogin, UserRegister
from services.auth_service import (
    get_current_user,
    login_user,
    refresh_access_token,
    register_user,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register")
async def register(user: UserRegister):
    return await register_user(user)


@router.post("/login", response_model=TokenResponse)
async def login(user: UserLogin, response: Response):
    token_response = await login_user(user)

    response.set_cookie(
        key="refresh_token",
        value=token_response["refresh_token"],
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7 * 24 * 60 * 60,
        expires=7 * 24 * 60 * 60,
        path="/",
    )

    return {
        "access_token": token_response["access_token"],
        "token_type": token_response["token_type"],
    }


@router.post("/refresh", response_model=TokenResponse)
async def refresh(response: Response, refresh_token: str | None = Cookie(default=None)):
    if refresh_token is None:
        raise HTTPException(
            status_code=401,
            detail="Refresh token missing"
        )

    token_response = await refresh_access_token(refresh_token)

    response.set_cookie(
        key="refresh_token",
        value=token_response["refresh_token"],
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7 * 24 * 60 * 60,
        expires=7 * 24 * 60 * 60,
        path="/",
    )

    return {
        "access_token": token_response["access_token"],
        "token_type": token_response["token_type"],
    }


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(
        key="refresh_token",
        path="/",
        secure=True,
        httponly=True,
        samesite="none",
    )

    return {"message": "Logged out successfully"}


@router.get("/me")
async def read_current_user(current_user: dict = Depends(get_current_user)):
    return current_user

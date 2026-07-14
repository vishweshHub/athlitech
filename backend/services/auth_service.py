from fastapi import Depends, HTTPException

from core.permissions import normalize_role
from core.security import (
    bearer_scheme,
    create_access_token,
    create_refresh_token,
    decode_access_token,
    decode_refresh_token,
    hash_password,
    verify_password,
)
from database.mongodb import users_collection
from schemas.auth_schema import UserLogin, UserRegister


def _validate_role(current_user: dict, allowed_roles: set[str]):
    current_role = normalize_role(current_user.get("role"))
    if current_role not in {normalize_role(role) for role in allowed_roles}:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    return current_user


async def register_user(user: UserRegister):
    email = str(user.email).lower()

    existing_user = await users_collection.find_one({"email": email})

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="User with this email already exists"
        )

    hashed_password = hash_password(user.password)

    await users_collection.insert_one({
        "name": user.name,
        "email": email,
        "hashed_password": hashed_password,
        "role": user.role
    })

    return {"message": "User registered successfully"}


async def login_user(user: UserLogin):
    email = str(user.email).lower()

    existing_user = await users_collection.find_one({"email": email})

    if not existing_user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    is_password_valid = verify_password(
        user.password,
        existing_user["hashed_password"]
    )

    if not is_password_valid:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    access_token = create_access_token({
        "sub": email,
        "role": normalize_role(existing_user.get("role", "athlete"))
    })

    refresh_token = create_refresh_token({
        "sub": email,
        "role": normalize_role(existing_user.get("role", "athlete"))
    })

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }


async def refresh_access_token(refresh_token: str):
    payload = decode_refresh_token(refresh_token)
    email = payload.get("sub")

    existing_user = await users_collection.find_one({"email": email})

    if not existing_user:
        raise HTTPException(
            status_code=401,
            detail="User not found"
        )

    access_token = create_access_token({
        "sub": email,
        "role": normalize_role(existing_user.get("role", "athlete"))
    })

    new_refresh_token = create_refresh_token({
        "sub": email,
        "role": normalize_role(existing_user.get("role", "athlete"))
    })

    return {
        "access_token": access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer"
    }


async def get_current_user(credentials=Depends(bearer_scheme)):
    token = credentials.credentials
    payload = decode_access_token(token)
    email = payload.get("sub")

    user = await users_collection.find_one({"email": email})

    if not user:
        raise HTTPException(
            status_code=401,
            detail="User not found"
        )

    return {
        "id": str(user["_id"]),
        "name": user["name"],
        "email": user["email"],
        "role": normalize_role(user.get("role", "athlete"))
    }


async def require_admin(current_user: dict = Depends(get_current_user)):
    return _validate_role(current_user, {"admin"})


async def require_coach_or_admin(current_user: dict = Depends(get_current_user)):
    return _validate_role(current_user, {"admin", "coach"})


async def require_admin_or_self(user_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["id"] == user_id:
        return current_user
    return _validate_role(current_user, {"admin"})

from fastapi import Depends, HTTPException

from core.permissions import normalize_role
from core.utils import get_utc_now
from core.constants import (
    ROLE_ADMIN,
    ROLE_COACH,
    ROLE_ATHLETE,
    ACCOUNT_STATUS_ACTIVE,
    VERIFICATION_STATUS_UNVERIFIED,
    TOKEN_TYPE_BEARER,
)
from core.security import (
    bearer_scheme,
    create_access_token,
    create_refresh_token,
    decode_access_token,
    decode_refresh_token,
    hash_password,
    verify_password,
)
from database.mongodb import (
    users_collection,
    accounts_collection,
    role_profiles_collection,
    memberships_collection,
    organizations_collection,
)
from schemas.auth_schema import UserLogin, RegisterRequest
import uuid
from datetime import datetime


def _validate_role(current_user: dict, allowed_roles: set[str]):
    current_role = normalize_role(current_user.get("role"))
    if current_role not in {normalize_role(role) for role in allowed_roles}:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    return current_user


async def register_user(user: RegisterRequest):
    email = str(user.email).lower()

    existing_user = await users_collection.find_one({"email": email})

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="User with this email already exists"
        )

    hashed_password = hash_password(user.password)

    role = user.role or "none"
    user_doc = {
        "name": f"{user.first_name} {user.last_name}",
        "first_name": user.first_name,
        "last_name": user.last_name,
        "email": email,
        "phone": getattr(user, "phone", None),
        "hashed_password": hashed_password,
        "role": role,
        "account_status": ACCOUNT_STATUS_ACTIVE,
        "profile_completed": False,
        "onboarding_completed": False,
        "registration_source": "self",
        "created_at": get_utc_now(),
        "updated_at": get_utc_now(),
    }

    if role == ROLE_COACH:
        user_doc["verification_status"] = VERIFICATION_STATUS_UNVERIFIED
        user_doc["coach_id"] = str(uuid.uuid4())

    result = await users_collection.insert_one(user_doc)
    user_id = str(result.inserted_id)

    # --- Dual-Write: Populate Unified Account Architecture ---
    account_doc = {
        "account_id": user_id,
        "email": email,
        "phone": getattr(user, "phone", None),
        "hashed_password": hashed_password,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "name": f"{user.first_name} {user.last_name}",
        "account_status": ACCOUNT_STATUS_ACTIVE,
        "verification_status": user_doc.get("verification_status", VERIFICATION_STATUS_UNVERIFIED),
        "profile_completed": False,
        "onboarding_completed": False,
        "registration_source": "self",
        "created_at": get_utc_now(),
        "updated_at": get_utc_now(),
    }
    await accounts_collection.insert_one(account_doc)

    if role in [ROLE_ATHLETE, ROLE_COACH]:
        rp_id = str(uuid.uuid4())
        rp_doc = {
            "role_profile_id": rp_id,
            "account_id": user_id,
            "profile_type": role,
            "created_at": get_utc_now(),
            "updated_at": get_utc_now(),
        }
        if role == ROLE_ATHLETE:
            rp_doc["athlete_data"] = {"sport": "General Athletics", "weight": 70}
        elif role == ROLE_COACH:
            rp_doc["coach_data"] = {"primary_sport": "General Athletics", "specialization": "Head Coach", "years_experience": 5}
        await role_profiles_collection.insert_one(rp_doc)

        default_org = await organizations_collection.find_one({"slug": "athlitech-primary"})
        org_id = default_org["organization_id"] if default_org else "org-default"

        mem_doc = {
            "membership_id": str(uuid.uuid4()),
            "account_id": user_id,
            "organization_id": org_id,
            "role_profile_id": rp_id,
            "role": role,
            "status": ACCOUNT_STATUS_ACTIVE,
            "teams": ["Default Team"],
            "created_at": get_utc_now(),
            "updated_at": get_utc_now(),
        }
        await memberships_collection.insert_one(mem_doc)


    return {
        "message": "User registered successfully",
        "user_id": user_id,
        "role": role,
        "email": email
    }



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

    user_id = str(existing_user["_id"])
    mem = await memberships_collection.find_one({"account_id": user_id})

    token_claims = {
        "sub": email,
        "role": normalize_role(existing_user.get("role", "athlete")),
        "account_id": user_id,
        "membership_id": mem.get("membership_id") if mem else None,
        "organization_id": mem.get("organization_id") if mem else None,
    }

    access_token = create_access_token(token_claims)
    refresh_token = create_refresh_token(token_claims)

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

    user_id = str(existing_user["_id"])
    mem = await memberships_collection.find_one({"account_id": user_id})

    token_claims = {
        "sub": email,
        "role": normalize_role(existing_user.get("role", "athlete")),
        "account_id": user_id,
        "membership_id": mem.get("membership_id") if mem else None,
        "organization_id": mem.get("organization_id") if mem else None,
    }

    access_token = create_access_token(token_claims)
    new_refresh_token = create_refresh_token(token_claims)

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

    user_id = str(user["_id"])
    mem = await memberships_collection.find_one({"account_id": user_id})

    return {
        "id": user_id,
        "account_id": user_id,
        "name": user["name"],
        "email": user["email"],
        "role": normalize_role(user.get("role", "athlete")),
        "profile_completed": user.get("profile_completed", False),
        "membership_id": mem.get("membership_id") if mem else None,
        "organization_id": mem.get("organization_id") if mem else None,
    }



async def require_admin(current_user: dict = Depends(get_current_user)):
    return _validate_role(current_user, {"admin"})


async def require_coach_or_admin(current_user: dict = Depends(get_current_user)):
    return _validate_role(current_user, {"admin", "coach"})


async def require_admin_or_self(user_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["id"] == user_id:
        return current_user
    return _validate_role(current_user, {"admin"})

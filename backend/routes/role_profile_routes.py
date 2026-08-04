from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List
import uuid

from services.auth_service import get_current_user
from database.mongodb import (
    users_collection,
    accounts_collection,
    role_profiles_collection,
    memberships_collection,
    organizations_collection,
    athletes_collection,
)
from core.utils import get_utc_now

router = APIRouter(prefix="/role-profiles", tags=["Role Profiles"])


class ActivateRoleRequest(BaseModel):
    role: str  # "athlete" | "coach" | "organization"


@router.get("/status")
async def get_role_profile_status(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    user_email = current_user["email"]
    legacy_role = current_user.get("role", "athlete")

    # Fetch role profiles for account
    role_profiles = await role_profiles_collection.find({"account_id": user_id}).to_list(length=100)
    rp_types = {rp.get("profile_type"): str(rp.get("role_profile_id")) for rp in role_profiles if rp.get("profile_type")}

    # Fetch memberships for account
    memberships = await memberships_collection.find({"account_id": user_id}).to_list(length=100)
    mem_roles = {m.get("role") for m in memberships if m.get("role")}

    # Check athlete status
    athlete_active = "athlete" in rp_types or legacy_role == "athlete" or "athlete" in mem_roles
    # Check coach status
    coach_active = "coach" in rp_types or legacy_role == "coach" or "coach" in mem_roles
    # Check organization status
    org_active = "organization" in rp_types or "owner" in mem_roles or "admin" in mem_roles or legacy_role == "admin"

    active_roles = []
    if athlete_active:
        active_roles.append("athlete")
    if coach_active:
        active_roles.append("coach")
    if org_active:
        active_roles.append("organization")

    return {
        "account_id": user_id,
        "email": user_email,
        "roles": {
            "athlete": {
                "active": athlete_active,
                "role_profile_id": rp_types.get("athlete")
            },
            "coach": {
                "active": coach_active,
                "role_profile_id": rp_types.get("coach")
            },
            "organization": {
                "active": org_active,
                "role_profile_id": rp_types.get("organization") or rp_types.get("admin")
            }

        },
        "active_roles": active_roles
    }


@router.post("/activate")
async def activate_role_profile(
    body: ActivateRoleRequest,
    current_user: dict = Depends(get_current_user)
):
    role = body.role.strip().lower()
    if role not in ["athlete", "coach", "organization"]:
        raise HTTPException(status_code=400, detail="Invalid role specified. Must be athlete, coach, or organization.")

    user_id = current_user["id"]
    now = get_utc_now()

    # Get default organization
    default_org = await organizations_collection.find_one({"slug": "athlitech-primary"})
    org_id = default_org["organization_id"] if default_org else "org-default"

    if role == "athlete":
        existing_rp = await role_profiles_collection.find_one({"account_id": user_id, "profile_type": "athlete"})
        if not existing_rp:
            rp_id = str(uuid.uuid4())
            await role_profiles_collection.insert_one({
                "role_profile_id": rp_id,
                "account_id": user_id,
                "profile_type": "athlete",
                "athlete_data": {"sport": "General Athletics", "weight": 70},
                "created_at": now,
                "updated_at": now,
            })
        else:
            rp_id = existing_rp["role_profile_id"]

        existing_mem = await memberships_collection.find_one({"account_id": user_id, "organization_id": org_id, "role": "athlete"})
        if not existing_mem:
            await memberships_collection.insert_one({
                "membership_id": str(uuid.uuid4()),
                "account_id": user_id,
                "organization_id": org_id,
                "role_profile_id": rp_id,
                "role": "athlete",
                "status": "active",
                "teams": ["Default Team"],
                "created_at": now,
                "updated_at": now,
            })

    elif role == "coach":
        existing_rp = await role_profiles_collection.find_one({"account_id": user_id, "profile_type": "coach"})
        if not existing_rp:
            rp_id = str(uuid.uuid4())
            await role_profiles_collection.insert_one({
                "role_profile_id": rp_id,
                "account_id": user_id,
                "profile_type": "coach",
                "coach_data": {"primary_sport": "General Athletics", "specialization": "Head Coach", "years_experience": 5},
                "created_at": now,
                "updated_at": now,
            })
        else:
            rp_id = existing_rp["role_profile_id"]

        existing_mem = await memberships_collection.find_one({"account_id": user_id, "organization_id": org_id, "role": "coach"})
        if not existing_mem:
            await memberships_collection.insert_one({
                "membership_id": str(uuid.uuid4()),
                "account_id": user_id,
                "organization_id": org_id,
                "role_profile_id": rp_id,
                "role": "coach",
                "status": "active",
                "teams": ["Default Team"],
                "created_at": now,
                "updated_at": now,
            })

        # Ensure user document has coach_id if missing
        from bson import ObjectId
        query = {"_id": ObjectId(user_id)} if ObjectId.is_valid(user_id) else {"_id": user_id}
        user_doc = await users_collection.find_one(query)
        if user_doc and not user_doc.get("coach_id"):
            await users_collection.update_one(query, {"$set": {"coach_id": str(uuid.uuid4())}})

    elif role == "organization":
        existing_rp = await role_profiles_collection.find_one({"account_id": user_id, "profile_type": "organization"})
        if not existing_rp:
            rp_id = str(uuid.uuid4())
            await role_profiles_collection.insert_one({
                "role_profile_id": rp_id,
                "account_id": user_id,
                "profile_type": "organization",
                "admin_data": {"department": "Organization Management", "access_level": "org_owner"},
                "created_at": now,
                "updated_at": now,
            })
        else:
            rp_id = existing_rp["role_profile_id"]

        # Create user's custom organization
        org_slug = f"org-{user_id[:8]}"
        user_org = await organizations_collection.find_one({"owner_account_id": user_id})
        if not user_org:
            new_org_id = str(uuid.uuid4())
            user_org = {
                "organization_id": new_org_id,
                "name": f"{current_user.get('name', 'User')}'s Organization",
                "slug": org_slug,
                "owner_account_id": user_id,
                "status": "active",
                "created_at": now,
                "updated_at": now,
            }
            await organizations_collection.insert_one(user_org)

        org_id_val = user_org["organization_id"]
        existing_mem = await memberships_collection.find_one({"account_id": user_id, "organization_id": org_id_val})
        if not existing_mem:
            await memberships_collection.insert_one({
                "membership_id": str(uuid.uuid4()),
                "account_id": user_id,
                "organization_id": org_id_val,
                "role_profile_id": rp_id,
                "role": "owner",
                "status": "active",
                "teams": ["Default Team"],
                "created_at": now,
                "updated_at": now,
            })

    return {
        "message": f"Successfully activated {role} role",
        "role": role,
        "active": True
    }

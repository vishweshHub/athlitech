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
    subscriptions_collection,
)
from core.utils import get_utc_now

router = APIRouter(prefix="/role-profiles", tags=["Role Profiles"])


class ActivateRoleRequest(BaseModel):
    role: str  # "athlete" | "coach" | "organization"


class DeactivateRoleRequest(BaseModel):
    role: str  # "athlete" | "coach" | "organization"


@router.get("/status")
async def get_role_profile_status(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    user_email = current_user["email"]
    legacy_role = current_user.get("role", "athlete")

    # Fetch role profiles for account
    role_profiles = await role_profiles_collection.find({"account_id": user_id}).to_list(length=100)
    rp_map = {}
    for rp in role_profiles:
        pt = rp.get("profile_type")
        if pt:
            rp_map[pt] = rp

    # Fetch memberships for account
    memberships = await memberships_collection.find({"account_id": user_id}).to_list(length=100)
    active_mem_roles = {m.get("role") for m in memberships if m.get("role") and m.get("status") != "inactive"}

    # Fetch subscriptions
    subscriptions = await subscriptions_collection.find({"account_id": user_id}).to_list(length=100)
    sub_map = {s.get("role"): s for s in subscriptions if s.get("role")}

    def check_role_status(role_key: str) -> dict:
        rp = rp_map.get(role_key)
        has_profile = rp is not None
        rp_status = rp.get("status", "active") if rp else "inactive"
        rp_active = rp.get("active", True) if rp else False

        mem_active = role_key in active_mem_roles or ("organization" == role_key and ("owner" in active_mem_roles or "admin" in active_mem_roles))

        # Role is active if profile exists and is not explicitly inactive AND membership is active (or legacy role match)
        is_active = False
        if has_profile:
            is_active = (rp_status != "inactive") and (rp_active is not False)
        elif mem_active:
            is_active = True
        elif legacy_role == role_key or (role_key == "organization" and legacy_role == "admin"):
            is_active = True

        sub = sub_map.get(role_key)
        plan_tier = sub.get("plan_tier") if sub else ("enterprise" if role_key == "organization" else "pro" if role_key == "athlete" else "starter")

        return {
            "active": is_active,
            "has_existing_profile": has_profile or mem_active or (legacy_role == role_key),
            "role_profile_id": str(rp.get("role_profile_id")) if rp and rp.get("role_profile_id") else None,
            "status": "active" if is_active else "inactive",
            "plan_tier": plan_tier,
            "billing_status": "Active" if is_active else "Cancelled",
        }

    ath_info = check_role_status("athlete")
    coach_info = check_role_status("coach")
    org_info = check_role_status("organization")

    active_roles = []
    if ath_info["active"]:
        active_roles.append("athlete")
    if coach_info["active"]:
        active_roles.append("coach")
    if org_info["active"]:
        active_roles.append("organization")

    return {
        "account_id": user_id,
        "email": user_email,
        "roles": {
            "athlete": ath_info,
            "coach": coach_info,
            "organization": org_info,
        },
        "active_roles": active_roles
    }


@router.post("/deactivate")
async def deactivate_role_profile(
    body: DeactivateRoleRequest,
    current_user: dict = Depends(get_current_user)
):
    role = body.role.strip().lower()
    if role not in ["athlete", "coach", "organization"]:
        raise HTTPException(status_code=400, detail="Invalid role specified. Must be athlete, coach, or organization.")

    user_id = current_user["id"]
    now = get_utc_now()

    # Mark RoleProfile inactive
    await role_profiles_collection.update_many(
        {"account_id": user_id, "profile_type": role},
        {"$set": {"status": "inactive", "active": False, "updated_at": now}}
    )

    # Mark Memberships inactive
    await memberships_collection.update_many(
        {"account_id": user_id, "role": role},
        {"$set": {"status": "inactive", "updated_at": now}}
    )
    if role == "organization":
        await memberships_collection.update_many(
            {"account_id": user_id, "role": {"$in": ["owner", "admin"]}},
            {"$set": {"status": "inactive", "updated_at": now}}
        )

    # Mark Subscriptions cancelled
    await subscriptions_collection.update_many(
        {"account_id": user_id, "role": role},
        {"$set": {"status": "cancelled", "updated_at": now}}
    )

    return {
        "message": f"Successfully deactivated {role} role subscription",
        "role": role,
        "active": False
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
                "status": "active",
                "active": True,
                "athlete_data": {"sport": "General Athletics", "weight": 70},
                "created_at": now,
                "updated_at": now,
            })
        else:
            rp_id = existing_rp["role_profile_id"]
            await role_profiles_collection.update_one(
                {"account_id": user_id, "profile_type": "athlete"},
                {"$set": {"status": "active", "active": True, "updated_at": now}}
            )

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
        else:
            await memberships_collection.update_one(
                {"membership_id": existing_mem["membership_id"]},
                {"$set": {"status": "active", "updated_at": now}}
            )

    elif role == "coach":
        existing_rp = await role_profiles_collection.find_one({"account_id": user_id, "profile_type": "coach"})
        if not existing_rp:
            rp_id = str(uuid.uuid4())
            await role_profiles_collection.insert_one({
                "role_profile_id": rp_id,
                "account_id": user_id,
                "profile_type": "coach",
                "status": "active",
                "active": True,
                "is_complete": False,
                "created_at": now,
                "updated_at": now,
            })
        else:
            rp_id = existing_rp["role_profile_id"]
            await role_profiles_collection.update_one(
                {"account_id": user_id, "profile_type": "coach"},
                {"$set": {"status": "active", "active": True, "updated_at": now}}
            )

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
        else:
            await memberships_collection.update_one(
                {"membership_id": existing_mem["membership_id"]},
                {"$set": {"status": "active", "updated_at": now}}
            )

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
                "status": "active",
                "active": True,
                "admin_data": {"department": "Organization Management", "access_level": "org_owner"},
                "created_at": now,
                "updated_at": now,
            })
        else:
            rp_id = existing_rp["role_profile_id"]
            await role_profiles_collection.update_one(
                {"account_id": user_id, "profile_type": "organization"},
                {"$set": {"status": "active", "active": True, "updated_at": now}}
            )

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
        else:
            await organizations_collection.update_one(
                {"owner_account_id": user_id},
                {"$set": {"status": "active", "updated_at": now}}
            )

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
        else:
            await memberships_collection.update_one(
                {"membership_id": existing_mem["membership_id"]},
                {"$set": {"status": "active", "updated_at": now}}
            )

    # Restore subscription status
    await subscriptions_collection.update_many(
        {"account_id": user_id, "role": role},
        {"$set": {"status": "active", "updated_at": now}}
    )

    return {
        "message": f"Successfully activated {role} role",
        "role": role,
        "active": True
    }

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import uuid
import re

from services.auth_service import get_current_user
from database.mongodb import (
    organizations_collection,
    memberships_collection,
    role_profiles_collection,
    subscriptions_collection,
)
from core.utils import get_utc_now

router = APIRouter(prefix="/organization", tags=["Organization"])


class CreateOrganizationRequest(BaseModel):
    name: str
    org_type: str = "Club"
    sport: str = "General Athletics"
    country: str = "United States"
    state: str = ""
    logo_url: Optional[str] = None
    timezone: str = "UTC"
    plan_tier: str = "club"  # "club" | "academy" | "enterprise"


class InviteMemberRequest(BaseModel):
    email: str
    role: str = "coach"  # "coach" | "athlete" | "admin"


class UpdatePlanRequest(BaseModel):
    plan_tier: str  # "club" | "academy" | "enterprise"


def _slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r'[^\w\s-]', '', text)
    return re.sub(r'[\s_-]+', '-', text).strip('-')


@router.get("/my-organization")
async def get_my_organization(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]

    # 1. Search organization where owner_account_id == user_id
    org = await organizations_collection.find_one({"owner_account_id": user_id})

    # 2. If not owner, check memberships
    if not org:
        mem = await memberships_collection.find_one({"account_id": user_id, "status": "active"})
        if mem and mem.get("organization_id"):
            org = await organizations_collection.find_one({"organization_id": mem["organization_id"]})

    if not org:
        return {"organization": None}
    org_id = org.get("organization_id") or str(org.get("_id"))
    sub = await subscriptions_collection.find_one({"organization_id": org_id})

    return {
        "organization": {
            "organization_id": org_id,
            "name": org.get("name"),
            "slug": org.get("slug"),
            "owner_account_id": org.get("owner_account_id"),
            "org_type": org.get("org_type", "Club"),
            "sport": org.get("sport", "General Athletics"),
            "country": org.get("country", "United States"),
            "state": org.get("state", ""),
            "logo_url": org.get("logo_url"),
            "timezone": org.get("timezone", "UTC"),
            "plan_tier": sub.get("plan_tier") if sub else org.get("plan_tier", "club"),
            "status": org.get("status", "active"),
            "created_at": str(org.get("created_at", "")),
        }
    }


@router.post("/create")
async def create_organization(
    body: CreateOrganizationRequest,
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["id"]
    now = get_utc_now()

    # Check if account already owns an organization
    existing_org = await organizations_collection.find_one({"owner_account_id": user_id})
    if existing_org:
        org_id = existing_org.get("organization_id") or str(existing_org.get("_id"))
        return {
            "message": "Organization already exists",
            "organization_id": org_id,
            "organization": {
                "organization_id": org_id,
                "name": existing_org.get("name"),
                "slug": existing_org.get("slug"),
                "owner_account_id": user_id,
                "org_type": existing_org.get("org_type", body.org_type),
                "sport": existing_org.get("sport", body.sport),
                "country": existing_org.get("country", body.country),
                "state": existing_org.get("state", body.state),
                "logo_url": existing_org.get("logo_url", body.logo_url),
                "timezone": existing_org.get("timezone", body.timezone),
                "plan_tier": existing_org.get("plan_tier", body.plan_tier),
                "status": "active",
            }
        }

    org_id = str(uuid.uuid4())
    slug = f"{_slugify(body.name)}-{user_id[:6]}"

    org_doc = {
        "organization_id": org_id,
        "name": body.name.strip(),
        "slug": slug,
        "owner_account_id": user_id,
        "org_type": body.org_type,
        "sport": body.sport,
        "country": body.country,
        "state": body.state,
        "logo_url": body.logo_url,
        "timezone": body.timezone,
        "plan_tier": body.plan_tier.lower(),
        "status": "active",
        "created_at": now,
        "updated_at": now,
    }
    await organizations_collection.insert_one(org_doc)

    # Create role_profile for organization if missing
    rp = await role_profiles_collection.find_one({"account_id": user_id, "profile_type": "organization"})
    if not rp:
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
        rp_id = rp["role_profile_id"]

    # Create owner membership
    existing_mem = await memberships_collection.find_one({"account_id": user_id, "organization_id": org_id})
    if not existing_mem:
        await memberships_collection.insert_one({
            "membership_id": str(uuid.uuid4()),
            "account_id": user_id,
            "organization_id": org_id,
            "role_profile_id": rp_id,
            "role": "owner",
            "status": "active",
            "teams": ["Default Team"],
            "created_at": now,
            "updated_at": now,
        })

    # Create subscription record
    sub_id = str(uuid.uuid4())
    await subscriptions_collection.insert_one({
        "subscription_id": sub_id,
        "organization_id": org_id,
        "plan_tier": body.plan_tier.lower(),
        "status": "active",
        "max_coaches": 5 if body.plan_tier == "club" else 25 if body.plan_tier == "academy" else 9999,
        "max_athletes": 100 if body.plan_tier == "club" else 500 if body.plan_tier == "academy" else 9999,
        "created_at": now,
        "updated_at": now,
    })

    return {
        "message": "Organization created successfully",
        "organization_id": org_id,
        "organization": {
            "organization_id": org_id,
            "name": body.name,
            "slug": slug,
            "owner_account_id": user_id,
            "org_type": body.org_type,
            "sport": body.sport,
            "country": body.country,
            "state": body.state,
            "logo_url": body.logo_url,
            "timezone": body.timezone,
            "plan_tier": body.plan_tier.lower(),
            "status": "active",
        }
    }


@router.put("/my-organization/plan")
async def update_organization_plan(
    body: UpdatePlanRequest,
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["id"]
    org = await organizations_collection.find_one({"owner_account_id": user_id})

    if not org:
        raise HTTPException(status_code=404, detail="No organization found for this account")

    org_id = org.get("organization_id") or str(org.get("_id"))
    new_tier = body.plan_tier.lower()

    await organizations_collection.update_one(
        {"organization_id": org_id},
        {"$set": {"plan_tier": new_tier, "updated_at": get_utc_now()}}
    )

    await subscriptions_collection.update_one(
        {"organization_id": org_id},
        {"$set": {"plan_tier": new_tier, "updated_at": get_utc_now()}},
        upsert=True
    )

    return {"message": f"Updated plan tier to {new_tier}", "plan_tier": new_tier}


@router.post("/my-organization/subscription/cancel")
@router.post("/subscription/cancel")
@router.post("/cancel-subscription")
async def cancel_org_subscription(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    now = get_utc_now()

    await role_profiles_collection.update_many(
        {"account_id": user_id, "profile_type": "organization"},
        {"$set": {"status": "inactive", "active": False, "updated_at": now}}
    )
    await memberships_collection.update_many(
        {"account_id": user_id, "role": {"$in": ["organization", "owner", "admin"]}},
        {"$set": {"status": "inactive", "updated_at": now}}
    )
    await subscriptions_collection.update_many(
        {"account_id": user_id},
        {"$set": {"status": "cancelled", "updated_at": now}}
    )

    return {
        "message": "Successfully cancelled organization subscription",
        "active": False
    }


@router.get("/my-organization/invitations")
async def get_organization_invitations(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    org = await organizations_collection.find_one({"owner_account_id": user_id})

    org_id = org.get("organization_id") if org else "org-demo"

    # Return sample structure for invitations UI
    return {
        "organization_id": org_id,
        "pending_invitations": [
            {
                "invitation_id": "inv_001",
                "email": "assistant.coach@athlitech-org.com",
                "role": "Coach",
                "sent_at": "2026-08-01 10:00:00",
                "expires_at": "2026-08-15 10:00:00",
                "status": "Pending",
                "invite_link": f"https://athlitech.app/join?org={org_id}&token=inv_001_secret"
            }
        ],
        "member_requests": [
            {
                "request_id": "req_001",
                "name": "Jordan Sprint",
                "email": "jordan.sprint@gmail.com",
                "role": "Athlete",
                "requested_at": "2026-08-03 14:30:00",
                "status": "Pending Approval"
            }
        ],
        "accepted_members": [
            {
                "member_id": "mem_001",
                "name": current_user.get("name", "Organization Owner"),
                "email": current_user.get("email"),
                "role": "Owner",
                "joined_at": "2026-08-01"
            }
        ],
        "expired_invitations": []
    }


@router.post("/my-organization/invitations")
async def create_organization_invitation(
    body: InviteMemberRequest,
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["id"]
    org = await organizations_collection.find_one({"owner_account_id": user_id})

    org_id = org.get("organization_id") if org else "org-demo"
    inv_id = f"inv_{uuid.uuid4().hex[:8]}"
    invite_link = f"https://athlitech.app/join?org={org_id}&token={inv_id}"

    return {
        "message": "Invitation created successfully",
        "invitation": {
            "invitation_id": inv_id,
            "email": body.email,
            "role": body.role.capitalize(),
            "sent_at": str(get_utc_now()),
            "status": "Pending",
            "invite_link": invite_link
        }
    }

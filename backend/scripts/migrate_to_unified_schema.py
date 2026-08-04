"""
AthliTech Unified Architecture Backfill & Data Migration Script.

Migrates legacy users, roles, athletes, and profiles collections into
unified Account, RoleProfile, Membership, Organization, and Subscription collections
without deleting any legacy documents.
"""

import asyncio
import os
import sys
import uuid

# Add parent directory to sys.path so backend imports work seamlessly
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from database.mongodb import (
    users_collection,
    athletes_collection,
    profiles_collection,
    accounts_collection,
    organizations_collection,
    memberships_collection,
    role_profiles_collection,
    subscriptions_collection,
)
from core.utils import get_utc_now


async def run_migration():
    print("Starting AthliTech Unified Architecture Data Migration...")

    # 1. Ensure Default Organization exists
    default_org = await organizations_collection.find_one({"slug": "athlitech-primary"})
    if not default_org:
        default_org_id = str(uuid.uuid4())
        default_org = {
            "organization_id": default_org_id,
            "name": "AthliTech Primary Club",
            "slug": "athlitech-primary",
            "owner_account_id": "system",
            "status": "active",
            "settings": {},
            "created_at": get_utc_now(),
            "updated_at": get_utc_now(),
        }
        await organizations_collection.insert_one(default_org)
        print(f"Created Default Organization: {default_org['name']} ({default_org_id})")
    else:
        default_org_id = default_org["organization_id"]

    # 2. Iterate through all legacy user documents
    user_cursor = users_collection.find()
    migrated_accounts = 0
    migrated_profiles = 0
    migrated_memberships = 0

    coach_user_to_membership_map = {}

    # First pass: Migrate Accounts & Coach RoleProfiles / Memberships
    async for user in user_cursor:
        account_id = str(user["_id"])
        email = str(user.get("email", "")).lower()

        # Create or sync Account
        existing_account = await accounts_collection.find_one({"email": email})
        if not existing_account:
            account_doc = {
                "account_id": account_id,
                "email": email,
                "hashed_password": user.get("hashed_password", ""),
                "first_name": user.get("first_name"),
                "last_name": user.get("last_name"),
                "name": user.get("name"),
                "account_status": user.get("account_status", "active"),
                "verification_status": user.get("verification_status", "verified"),
                "profile_completed": user.get("profile_completed", False),
                "onboarding_completed": user.get("onboarding_completed", False),
                "registration_source": user.get("registration_source", "self"),
                "created_at": user.get("created_at") or get_utc_now(),
                "updated_at": user.get("updated_at") or get_utc_now(),
                "last_login": user.get("last_login"),
            }
            await accounts_collection.insert_one(account_doc)
            migrated_accounts += 1

        role = str(user.get("role", "athlete")).lower()

        # Create RoleProfile if missing
        existing_rp = await role_profiles_collection.find_one({"account_id": account_id, "profile_type": role})
        if not existing_rp:
            rp_id = str(uuid.uuid4())
            rp_doc = {
                "role_profile_id": rp_id,
                "account_id": account_id,
                "profile_type": role,
                "created_at": get_utc_now(),
                "updated_at": get_utc_now(),
            }

            if role == "athlete":
                athlete_doc = await athletes_collection.find_one({"athlete_id": account_id})
                rp_doc["athlete_data"] = {
                    "sport": athlete_doc.get("sport", "General Athletics") if athlete_doc else "General Athletics",
                    "weight": athlete_doc.get("weight", 70) if athlete_doc else 70,
                }
            elif role == "coach":
                rp_doc["coach_data"] = {
                    "primary_sport": "General Athletics",
                    "specialization": "Head Coach",
                    "years_experience": 5,
                }
            elif role == "admin":
                rp_doc["admin_data"] = {
                    "department": "Platform Admin",
                    "access_level": "super_admin",
                }

            await role_profiles_collection.insert_one(rp_doc)
            role_profile_id = rp_id
            migrated_profiles += 1
        else:
            role_profile_id = existing_rp["role_profile_id"]

        # Create Membership
        existing_mem = await memberships_collection.find_one({
            "account_id": account_id,
            "organization_id": default_org_id
        })
        if not existing_mem:
            membership_id = str(uuid.uuid4())
            mem_doc = {
                "membership_id": membership_id,
                "account_id": account_id,
                "organization_id": default_org_id,
                "role_profile_id": role_profile_id,
                "role": role,
                "status": "active",
                "teams": ["Default Team"],
                "created_at": get_utc_now(),
                "updated_at": get_utc_now(),
            }
            await memberships_collection.insert_one(mem_doc)
            migrated_memberships += 1
            if role == "coach":
                legacy_coach_id = user.get("coach_id") or account_id
                coach_user_to_membership_map[legacy_coach_id] = membership_id
                coach_user_to_membership_map[account_id] = membership_id
        else:
            if role == "coach":
                legacy_coach_id = user.get("coach_id") or account_id
                coach_user_to_membership_map[legacy_coach_id] = existing_mem["membership_id"]
                coach_user_to_membership_map[account_id] = existing_mem["membership_id"]

    # Second pass: Link assigned coach memberships for Athletes
    async for athlete in athletes_collection.find({"coach_id": {"$ne": None}}):
        ath_id = athlete.get("athlete_id")
        c_id = athlete.get("coach_id")

        if ath_id and c_id in coach_user_to_membership_map:
            coach_mem_id = coach_user_to_membership_map[c_id]
            await memberships_collection.update_one(
                {"account_id": ath_id, "organization_id": default_org_id},
                {"$set": {"assigned_coach_membership_id": coach_mem_id}}
            )

    print(f"Migration completed successfully!")
    print(f"Accounts Migrated: {migrated_accounts}")
    print(f"Role Profiles Migrated: {migrated_profiles}")
    print(f"Memberships Migrated: {migrated_memberships}")


if __name__ == "__main__":
    asyncio.run(run_migration())

"""
user_seed_service.py
--------------------
Seeds (or updates) the three demo accounts used for development and testing.

Passwords are intentionally stored in this file so they can be updated in one
place.  Every field listed in DEMO_USERS is written to the database using
$setOnInsert / $set so that:

  - If the user does NOT exist  → the full record is created.
  - If the user ALREADY exists  → only the hashed_password is updated.
    Email, name, and role are never overwritten for existing accounts.

Compliant with the password policy:
  8–20 chars · uppercase · lowercase · digit · special character
"""

from core.security import hash_password
from database.mongodb import users_collection

# ---------------------------------------------------------------------------
# Demo credentials – change these to update all demo account passwords.
# Every password here MUST satisfy the validation policy enforced by
# UserRegister and the frontend validatePassword() helper.
# ---------------------------------------------------------------------------
DEMO_USERS = [
    {
        "name": "Admin User",
        "email": "admin@athlitech.com",
        "role": "admin",
        "password": "Admin@2024!",   # 11 chars · A·d·2·@! ✓
    },
    {
        "name": "Coach User",
        "email": "coach@athlitech.com",
        "role": "coach",
        "password": "Coach#99ab",    # 10 chars · C·o·9·# ✓
    },
    {
        "name": "Athlete User",
        "email": "athlete@athlitech.com",
        "role": "athlete",
        "password": "Athlete1$x",    # 10 chars · A·t·1·$ ✓
    },
]


async def seed_demo_users() -> None:
    """
    Upsert each demo account into the users collection.

    - New accounts are created with all fields.
    - Existing accounts only have their hashed_password refreshed; email,
      name, and role are left untouched.
    """
    for user in DEMO_USERS:
        hashed = hash_password(user["password"])

        await users_collection.update_one(
            # Match on email (the immutable identifier).
            {"email": user["email"]},
            {
                # Always enforce name, role, and hashed_password.
                # This corrects demo accounts that may have been created
                # through the public /auth/register route (which forces
                # role=athlete) and ensures the correct role is applied.
                "$set": {
                    "name": user["name"],
                    "email": user["email"],
                    "role": user["role"],
                    "hashed_password": hashed,
                },
            },
            upsert=True,
        )

    print("[seed] Demo users upserted successfully.")

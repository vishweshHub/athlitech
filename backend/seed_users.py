"""
seed_users.py
-------------
Standalone script to seed / reset demo user accounts in MongoDB.

Run from the backend directory with the venv activated:

    cd backend
    source venv/bin/activate
    python seed_users.py

This script is safe to run multiple times.  If an account already exists, its
password hash is updated.  Emails, names, and roles are never changed for
existing accounts.
"""

import asyncio

from services.user_seed_service import DEMO_USERS, seed_demo_users


async def main() -> None:
    print("=" * 50)
    print("AthliTech – Demo User Seed Script")
    print("=" * 50)

    await seed_demo_users()

    print()
    print("Demo credentials:")
    print("-" * 50)
    for user in DEMO_USERS:
        print(f"  Role    : {user['role'].upper()}")
        print(f"  Email   : {user['email']}")
        print(f"  Password: {user['password']}")
        print()
    print("All accounts are ready.  Start the backend and log in.")
    print("=" * 50)


if __name__ == "__main__":
    asyncio.run(main())

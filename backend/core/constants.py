"""
AthliTech Core System Constants.

Centralizes system-wide constants for roles, entity statuses, pagination defaults,
and authentication configurations to prevent scattered magic strings and numbers.
"""

from typing import Dict, List

# User Roles
ROLE_ADMIN = "admin"
ROLE_COACH = "coach"
ROLE_ATHLETE = "athlete"
DEFAULT_ROLE = ROLE_ATHLETE

VALID_ROLES = {ROLE_ADMIN, ROLE_COACH, ROLE_ATHLETE}

# Default Role Permissions Mapping
DEFAULT_ROLE_PERMISSIONS: Dict[str, List[str]] = {
    ROLE_ADMIN: [
        "manage_users",
        "manage_roles",
        "manage_athletes",
        "manage_coaches",
        "manage_organizations",
        "invite_members",
        "manage_subscriptions",
        "view_analytics",
        "view_athlete_profiles",
        "assign_workouts",
        "edit_workouts",
        "view_self",
    ],
    ROLE_COACH: [
        "manage_athletes",
        "view_athlete_profiles",
        "assign_workouts",
        "edit_workouts",
        "invite_members",
        "manage_subscriptions",
        "view_analytics",
        "view_self",
    ],
    ROLE_ATHLETE: [
        "view_self",
        "view_athlete_profiles",
        "manage_subscriptions",
        "view_analytics",
    ],
}

# Account & Verification Statuses
ACCOUNT_STATUS_ACTIVE = "active"
ACCOUNT_STATUS_INACTIVE = "inactive"

VERIFICATION_STATUS_VERIFIED = "verified"
VERIFICATION_STATUS_UNVERIFIED = "unverified"

# Workout & Session Statuses
STATUS_PENDING = "pending"
STATUS_IN_PROGRESS = "in_progress"
STATUS_COMPLETED = "completed"
STATUS_SKIPPED = "skipped"
STATUS_CANCELLED = "cancelled"
STATUS_DRAFT = "draft"
STATUS_ARCHIVED = "archived"
STATUS_ACTIVE = "active"

# Pagination Defaults
DEFAULT_PAGE_SKIP = 0
DEFAULT_PAGE_LIMIT = 100
MAX_PAGE_LIMIT = 500

# Security & Authentication Constants
TOKEN_TYPE_BEARER = "bearer"
DEFAULT_JWT_ALGORITHM = "HS256"
DEFAULT_ACCESS_TOKEN_EXPIRE_MINUTES = 15
DEFAULT_REFRESH_TOKEN_EXPIRE_DAYS = 7

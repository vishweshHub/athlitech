"""
AthliTech Role Permissions Management.

Defines default roles, permission scopes, and role normalization helpers.
"""

from typing import Dict, List
from core.constants import DEFAULT_ROLE, DEFAULT_ROLE_PERMISSIONS


def normalize_role(role: str | None) -> str:
    """
    Normalizes role input string. Defaults to DEFAULT_ROLE ('athlete') if None or empty.

    Args:
        role (str | None): Role string to normalize.

    Returns:
        str: Lowercase trimmed role name.
    """
    if role is None:
        return DEFAULT_ROLE

    normalized = str(role).strip().lower()
    return normalized or DEFAULT_ROLE


def is_valid_role(role: str) -> bool:
    """
    Checks whether a role is non-null and normalizable.

    Args:
        role (str): Role string to test.

    Returns:
        bool: True if role is valid.
    """
    if role is None:
        return False

    return bool(normalize_role(role))


def get_role_permissions(role: str | None) -> List[str]:
    """
    Retrieves permission strings associated with a given role.
    """
    norm = normalize_role(role)
    return list(DEFAULT_ROLE_PERMISSIONS.get(norm, DEFAULT_ROLE_PERMISSIONS.get(DEFAULT_ROLE, [])))


def has_permission(role: str | None, permission: str, user_permissions: List[str] | None = None) -> bool:
    """
    Verifies whether a user has the specified permission scope.
    Checks explicit user_permissions first, falling back to role-level default permissions.
    """
    if user_permissions and permission in user_permissions:
        return True

    perms = get_role_permissions(role)
    return permission in perms



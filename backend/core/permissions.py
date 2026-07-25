from typing import Dict, List

DEFAULT_ROLE_PERMISSIONS: Dict[str, List[str]] = {
    "admin": [
        "manage_users",
        "manage_roles",
        "manage_athletes",
        "view_self",
    ],
    "coach": [
        "manage_athletes",
        "view_self",
    ],
    "athlete": [
        "view_self",
    ],
}


def normalize_role(role: str | None) -> str:
    if role is None:
        return "athlete"

    normalized = str(role).strip().lower()
    return normalized or "athlete"


def is_valid_role(role: str) -> bool:
    if role is None:
        return False

    return bool(normalize_role(role))

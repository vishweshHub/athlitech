from enum import Enum
from typing import Dict, List


class Role(str, Enum):
    Admin = "Admin"
    Coach = "Coach"
    Athlete = "Athlete"


ROLE_PERMISSIONS: Dict[Role, List[str]] = {
    Role.Admin: [
        "manage_users",
        "manage_roles",
        "manage_athletes",
        "view_self",
    ],
    Role.Coach: [
        "manage_athletes",
        "view_self",
    ],
    Role.Athlete: [
        "view_self",
    ],
}


def is_valid_role(role: str) -> bool:
    try:
        Role(role)
        return True
    except ValueError:
        return False

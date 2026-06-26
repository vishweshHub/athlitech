from pydantic import BaseModel
from typing import List

from core.permissions import Role


class RoleCreate(BaseModel):
    name: Role
    permissions: List[str] = []


class RoleRead(BaseModel):
    id: str
    name: Role
    permissions: List[str] = []

from typing import List

from pydantic import BaseModel, Field


class RoleCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=50)
    permissions: List[str] = Field(default_factory=list)


class RoleRead(BaseModel):
    id: str
    name: str
    permissions: List[str] = Field(default_factory=list)

from pydantic import BaseModel, EmailStr, Field

from core.permissions import Role


class UserCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8)


class UserRead(BaseModel):
    id: str
    name: str
    email: EmailStr
    role: Role


class UserRoleUpdate(BaseModel):
    role: Role

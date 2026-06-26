from pydantic import BaseModel, EmailStr


class User(BaseModel):
    name: str
    email: EmailStr
    hashed_password: str
    role: str = "Athlete"

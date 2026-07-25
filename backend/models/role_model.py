from pydantic import BaseModel
from typing import List


class Role(BaseModel):
    name: str
    permissions: List[str] = []

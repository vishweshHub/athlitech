from pydantic import BaseModel

class Athlete(BaseModel):
    name: str
    sport: str
    weight: int
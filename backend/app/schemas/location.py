from pydantic import BaseModel
from uuid import UUID


class LocationCreate(BaseModel):
    name: str
    short_code: str


class LocationResponse(BaseModel):
    id: UUID
    name: str
    short_code: str
    warehouse_id: UUID

    class Config:
        from_attributes = True

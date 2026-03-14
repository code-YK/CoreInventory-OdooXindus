from pydantic import BaseModel
from uuid import UUID
from typing import Optional


class WarehouseCreate(BaseModel):
    name: str
    short_code: str
    address: Optional[str] = None


class WarehouseResponse(BaseModel):
    id: UUID
    name: str
    short_code: str
    address: Optional[str] = None

    class Config:
        from_attributes = True

from pydantic import BaseModel
from uuid import UUID
from typing import Optional


class ProductCreate(BaseModel):
    name: str
    sku: str
    category_id: Optional[UUID] = None
    unit: str = "pcs"
    reorder_level: int = 0


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    sku: Optional[str] = None
    category_id: Optional[UUID] = None
    unit: Optional[str] = None
    reorder_level: Optional[int] = None


class ProductResponse(BaseModel):
    id: UUID
    name: str
    sku: str
    category_id: Optional[UUID] = None
    unit: str
    reorder_level: int
    is_active: bool

    class Config:
        from_attributes = True

from pydantic import BaseModel
from uuid import UUID
from typing import Optional


class InventoryResponse(BaseModel):
    id: UUID
    product_id: UUID
    product_name: str
    sku: str
    location_id: UUID
    location_name: str
    warehouse_name: str
    quantity: int
    reserved_qty: int
    free_to_use: int
    reorder_level: int
    is_low_stock: bool

    class Config:
        from_attributes = True

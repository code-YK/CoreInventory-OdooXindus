from pydantic import BaseModel
from uuid import UUID
from typing import Optional, List
from datetime import datetime


# --- Operation Items ---

class OperationItemCreate(BaseModel):
    product_id: UUID
    quantity: int


class AdjustmentItemCreate(BaseModel):
    product_id: UUID
    counted_quantity: int


class OperationItemResponse(BaseModel):
    id: UUID
    product_id: UUID
    product_name: Optional[str] = None
    quantity: int

    class Config:
        from_attributes = True


# --- Receipt ---

class ReceiptCreate(BaseModel):
    dest_location_id: UUID
    supplier: Optional[str] = None
    items: List[OperationItemCreate]


# --- Delivery ---

class DeliveryCreate(BaseModel):
    source_location_id: UUID
    customer: Optional[str] = None
    items: List[OperationItemCreate]


# --- Transfer ---

class TransferCreate(BaseModel):
    source_location_id: UUID
    dest_location_id: UUID
    items: List[OperationItemCreate]


# --- Adjustment ---

class AdjustmentCreate(BaseModel):
    location_id: UUID
    items: List[AdjustmentItemCreate]


# --- Operation Response (shared) ---

class OperationResponse(BaseModel):
    id: UUID
    type: str
    status: str
    reference: str
    source_location_id: Optional[UUID] = None
    dest_location_id: Optional[UUID] = None
    supplier: Optional[str] = None
    customer: Optional[str] = None
    created_by: UUID
    created_at: datetime
    items: List[OperationItemResponse] = []

    class Config:
        from_attributes = True


# --- History ---

class HistoryItemResponse(BaseModel):
    product_name: str
    quantity: int


class HistoryResponse(BaseModel):
    id: UUID
    reference: str
    type: str
    status: str
    created_by_email: str
    created_at: datetime
    source_location_name: Optional[str] = None
    dest_location_name: Optional[str] = None
    items: List[HistoryItemResponse] = []

    class Config:
        from_attributes = True

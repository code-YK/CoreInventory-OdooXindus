from uuid import UUID
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.inventory import InventoryResponse
from app.services import inventory_service

router = APIRouter(prefix="/inventory", tags=["Inventory"])


@router.get("", response_model=list[InventoryResponse])
def list_inventory(
    warehouse_id: Optional[UUID] = Query(None),
    location_id: Optional[UUID] = Query(None),
    product_id: Optional[UUID] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return inventory_service.list_inventory(db, warehouse_id=warehouse_id, location_id=location_id, product_id=product_id)


@router.get("/low-stock", response_model=list[InventoryResponse])
def list_low_stock(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return inventory_service.list_low_stock(db)

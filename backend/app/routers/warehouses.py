from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.warehouse import Warehouse
from app.models.location import Location
from app.schemas.warehouse import WarehouseCreate, WarehouseResponse
from app.schemas.location import LocationCreate, LocationResponse

router = APIRouter(prefix="/warehouses", tags=["Warehouses"])


@router.get("", response_model=list[WarehouseResponse])
def list_warehouses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(Warehouse).all()


@router.post("", response_model=WarehouseResponse)
def create_warehouse(
    data: WarehouseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = db.query(Warehouse).filter(Warehouse.short_code == data.short_code).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Warehouse with short code '{data.short_code}' already exists",
        )
    warehouse = Warehouse(**data.model_dump())
    db.add(warehouse)
    db.commit()
    db.refresh(warehouse)
    return warehouse


@router.get("/{warehouse_id}/locations", response_model=list[LocationResponse])
def list_locations(
    warehouse_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    warehouse = db.query(Warehouse).filter(Warehouse.id == warehouse_id).first()
    if not warehouse:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Warehouse not found")
    return db.query(Location).filter(Location.warehouse_id == warehouse_id).all()


@router.post("/{warehouse_id}/locations", response_model=LocationResponse)
def create_location(
    warehouse_id: UUID,
    data: LocationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    warehouse = db.query(Warehouse).filter(Warehouse.id == warehouse_id).first()
    if not warehouse:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Warehouse not found")

    location = Location(warehouse_id=warehouse_id, **data.model_dump())
    db.add(location)
    db.commit()
    db.refresh(location)
    return location

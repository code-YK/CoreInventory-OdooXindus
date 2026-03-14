from uuid import UUID
from typing import Optional, List
from datetime import datetime, timezone
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status
from app.models.inventory import Inventory
from app.models.product import Product
from app.models.location import Location
from app.models.warehouse import Warehouse


def get_or_create_inventory(product_id: UUID, location_id: UUID, db: Session) -> Inventory:
    """Get existing inventory record or create one with zero quantity."""
    inv = db.query(Inventory).filter(
        Inventory.product_id == product_id,
        Inventory.location_id == location_id,
    ).first()

    if not inv:
        inv = Inventory(product_id=product_id, location_id=location_id, quantity=0, reserved_qty=0)
        db.add(inv)
        db.flush()

    return inv


def increase_stock(product_id: UUID, location_id: UUID, qty: int, db: Session) -> None:
    """Increase inventory quantity at a location (used by receipts)."""
    inv = get_or_create_inventory(product_id, location_id, db)
    inv.quantity += qty
    inv.updated_at = datetime.now(timezone.utc)
    db.flush()


def decrease_stock(product_id: UUID, location_id: UUID, qty: int, db: Session) -> None:
    """Decrease inventory quantity at a location (used by deliveries). Checks sufficiency."""
    inv = get_or_create_inventory(product_id, location_id, db)
    if inv.quantity < qty:
        product = db.query(Product).filter(Product.id == product_id).first()
        product_name = product.name if product else str(product_id)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient stock for product '{product_name}'. Available: {inv.quantity}, Requested: {qty}",
        )
    inv.quantity -= qty
    inv.updated_at = datetime.now(timezone.utc)
    db.flush()


def set_stock(product_id: UUID, location_id: UUID, counted_qty: int, db: Session) -> int:
    """Set inventory to counted quantity (adjustment). Returns delta."""
    inv = get_or_create_inventory(product_id, location_id, db)
    delta = counted_qty - inv.quantity
    inv.quantity = counted_qty
    inv.updated_at = datetime.now(timezone.utc)
    db.flush()
    return delta


def _build_inventory_response(inv: Inventory) -> dict:
    """Build a response dict with computed fields."""
    return {
        "id": inv.id,
        "product_id": inv.product_id,
        "product_name": inv.product.name if inv.product else "",
        "sku": inv.product.sku if inv.product else "",
        "location_id": inv.location_id,
        "location_name": inv.location.name if inv.location else "",
        "warehouse_name": inv.location.warehouse.name if inv.location and inv.location.warehouse else "",
        "quantity": inv.quantity,
        "reserved_qty": inv.reserved_qty,
        "free_to_use": inv.quantity - inv.reserved_qty,
        "reorder_level": inv.product.reorder_level if inv.product else 0,
        "is_low_stock": inv.quantity < (inv.product.reorder_level if inv.product else 0),
    }


def list_inventory(
    db: Session,
    warehouse_id: Optional[UUID] = None,
    location_id: Optional[UUID] = None,
    product_id: Optional[UUID] = None,
) -> List[dict]:
    query = (
        db.query(Inventory)
        .join(Product, Inventory.product_id == Product.id)
        .join(Location, Inventory.location_id == Location.id)
        .join(Warehouse, Location.warehouse_id == Warehouse.id)
        .options(
            joinedload(Inventory.product),
            joinedload(Inventory.location).joinedload(Location.warehouse),
        )
    )

    if warehouse_id:
        query = query.filter(Warehouse.id == warehouse_id)
    if location_id:
        query = query.filter(Inventory.location_id == location_id)
    if product_id:
        query = query.filter(Inventory.product_id == product_id)

    records = query.all()
    return [_build_inventory_response(inv) for inv in records]


def list_low_stock(db: Session) -> List[dict]:
    records = (
        db.query(Inventory)
        .join(Product, Inventory.product_id == Product.id)
        .join(Location, Inventory.location_id == Location.id)
        .join(Warehouse, Location.warehouse_id == Warehouse.id)
        .options(
            joinedload(Inventory.product),
            joinedload(Inventory.location).joinedload(Location.warehouse),
        )
        .filter(Inventory.quantity < Product.reorder_level)
        .all()
    )
    return [_build_inventory_response(inv) for inv in records]

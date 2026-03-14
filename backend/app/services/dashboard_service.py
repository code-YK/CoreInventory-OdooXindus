from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.product import Product
from app.models.inventory import Inventory
from app.models.operation import Operation


def get_kpis(db: Session) -> dict:
    total_products = db.query(func.count(Product.id)).filter(Product.is_active == True).scalar() or 0

    low_stock_count = (
        db.query(func.count(Inventory.id))
        .join(Product, Inventory.product_id == Product.id)
        .filter(Inventory.quantity < Product.reorder_level)
        .scalar()
    ) or 0

    pending_receipts = (
        db.query(func.count(Operation.id))
        .filter(Operation.type == "receipt", Operation.status == "confirmed")
        .scalar()
    ) or 0

    pending_deliveries = (
        db.query(func.count(Operation.id))
        .filter(Operation.type == "delivery", Operation.status == "confirmed")
        .scalar()
    ) or 0

    pending_transfers = (
        db.query(func.count(Operation.id))
        .filter(Operation.type == "transfer", Operation.status == "confirmed")
        .scalar()
    ) or 0

    return {
        "total_products": total_products,
        "low_stock_count": low_stock_count,
        "pending_receipts": pending_receipts,
        "pending_deliveries": pending_deliveries,
        "pending_transfers": pending_transfers,
    }

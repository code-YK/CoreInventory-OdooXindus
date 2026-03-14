from uuid import UUID
from typing import Optional, List
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status
from app.models.operation import Operation
from app.models.operation_item import OperationItem
from app.utils.reference import generate_reference
from app.services import inventory_service


def list_adjustments(db: Session, filter_status: Optional[str] = None) -> List[Operation]:
    query = db.query(Operation).filter(Operation.type == "adjustment").options(
        joinedload(Operation.items).joinedload(OperationItem.product)
    )
    if filter_status:
        query = query.filter(Operation.status == filter_status)
    return query.order_by(Operation.created_at.desc()).all()


def create_adjustment(location_id: UUID, items: list, user_id: UUID, db: Session) -> Operation:
    reference = generate_reference("ADJ", db)

    operation = Operation(
        type="adjustment",
        status="draft",
        reference=reference,
        dest_location_id=location_id,
        created_by=user_id,
    )
    db.add(operation)
    db.flush()

    for item in items:
        # Store the counted_quantity as the quantity in operation_items
        op_item = OperationItem(
            operation_id=operation.id,
            product_id=item.product_id,
            quantity=item.counted_quantity,
        )
        db.add(op_item)

    db.commit()
    db.refresh(operation)
    return operation


def done_adjustment(adjustment_id: UUID, db: Session) -> Operation:
    operation = (
        db.query(Operation)
        .filter(Operation.id == adjustment_id, Operation.type == "adjustment")
        .options(joinedload(Operation.items))
        .first()
    )
    if not operation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Adjustment not found")

    if operation.status not in ("draft", "confirmed"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status transition from '{operation.status}' to 'done'",
        )

    location_id = operation.dest_location_id

    # Apply adjustment: set inventory to counted quantity
    for item in operation.items:
        counted_qty = item.quantity  # stored counted_quantity
        delta = inventory_service.set_stock(item.product_id, location_id, counted_qty, db)
        # Update the operation item quantity to reflect the delta for logging
        item.quantity = counted_qty

    operation.status = "done"
    db.commit()
    db.refresh(operation)
    return operation

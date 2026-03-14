from uuid import UUID
from typing import Optional, List
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status
from app.models.operation import Operation
from app.models.operation_item import OperationItem
from app.utils.reference import generate_reference
from app.services import inventory_service


VALID_TRANSITIONS = {
    ("draft", "confirmed"),
    ("confirmed", "done"),
    ("draft", "cancelled"),
    ("confirmed", "cancelled"),
}


def _validate_transition(current: str, target: str):
    if (current, target) not in VALID_TRANSITIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status transition from '{current}' to '{target}'",
        )


def list_transfers(db: Session, filter_status: Optional[str] = None) -> List[Operation]:
    query = db.query(Operation).filter(Operation.type == "transfer").options(
        joinedload(Operation.items).joinedload(OperationItem.product)
    )
    if filter_status:
        query = query.filter(Operation.status == filter_status)
    return query.order_by(Operation.created_at.desc()).all()


def create_transfer(source_location_id: UUID, dest_location_id: UUID, items: list, user_id: UUID, db: Session) -> Operation:
    reference = generate_reference("TRF", db)

    operation = Operation(
        type="transfer",
        status="draft",
        reference=reference,
        source_location_id=source_location_id,
        dest_location_id=dest_location_id,
        created_by=user_id,
    )
    db.add(operation)
    db.flush()

    for item in items:
        op_item = OperationItem(
            operation_id=operation.id,
            product_id=item.product_id,
            quantity=item.quantity,
        )
        db.add(op_item)

    db.commit()
    db.refresh(operation)
    return operation


def confirm_transfer(transfer_id: UUID, db: Session) -> Operation:
    operation = db.query(Operation).filter(Operation.id == transfer_id, Operation.type == "transfer").first()
    if not operation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transfer not found")

    _validate_transition(operation.status, "confirmed")
    operation.status = "confirmed"
    db.commit()
    db.refresh(operation)
    return operation


def done_transfer(transfer_id: UUID, db: Session) -> Operation:
    operation = (
        db.query(Operation)
        .filter(Operation.id == transfer_id, Operation.type == "transfer")
        .options(joinedload(Operation.items))
        .first()
    )
    if not operation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transfer not found")

    _validate_transition(operation.status, "done")

    if not operation.source_location_id or not operation.dest_location_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Transfer requires both source and destination locations",
        )

    # Check source stock and move to dest
    for item in operation.items:
        inventory_service.decrease_stock(item.product_id, operation.source_location_id, item.quantity, db)
        inventory_service.increase_stock(item.product_id, operation.dest_location_id, item.quantity, db)

    operation.status = "done"
    db.commit()
    db.refresh(operation)
    return operation


def cancel_transfer(transfer_id: UUID, db: Session) -> Operation:
    operation = db.query(Operation).filter(Operation.id == transfer_id, Operation.type == "transfer").first()
    if not operation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transfer not found")

    _validate_transition(operation.status, "cancelled")
    operation.status = "cancelled"
    db.commit()
    db.refresh(operation)
    return operation

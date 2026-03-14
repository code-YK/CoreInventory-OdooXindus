from uuid import UUID
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.operation import ReceiptCreate, OperationResponse
from app.services import receipt_service

router = APIRouter(prefix="/receipts", tags=["Receipts"])


@router.get("", response_model=list[OperationResponse])
def list_receipts(
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    operations = receipt_service.list_receipts(db, filter_status=status)
    return _serialize_operations(operations)


@router.post("", response_model=OperationResponse)
def create_receipt(
    data: ReceiptCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    operation = receipt_service.create_receipt(
        dest_location_id=data.dest_location_id,
        supplier=data.supplier,
        items=data.items,
        user_id=current_user.id,
        db=db,
    )
    return _serialize_operation(operation, db)


@router.put("/{receipt_id}/confirm", response_model=OperationResponse)
def confirm_receipt(
    receipt_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    operation = receipt_service.confirm_receipt(receipt_id, db)
    return _serialize_operation(operation, db)


@router.put("/{receipt_id}/done", response_model=OperationResponse)
def done_receipt(
    receipt_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    operation = receipt_service.done_receipt(receipt_id, db)
    return _serialize_operation(operation, db)


@router.put("/{receipt_id}/cancel", response_model=OperationResponse)
def cancel_receipt(
    receipt_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    operation = receipt_service.cancel_receipt(receipt_id, db)
    return _serialize_operation(operation, db)


def _serialize_operation(operation, db: Session):
    from app.models.operation_item import OperationItem
    from app.models.product import Product
    from sqlalchemy.orm import joinedload

    # Reload with items eagerly loaded
    from app.models.operation import Operation
    op = db.query(Operation).filter(Operation.id == operation.id).options(
        joinedload(Operation.items).joinedload(OperationItem.product)
    ).first()

    items = []
    for item in op.items:
        items.append({
            "id": item.id,
            "product_id": item.product_id,
            "product_name": item.product.name if item.product else None,
            "quantity": item.quantity,
        })

    return {
        "id": op.id,
        "type": op.type,
        "status": op.status,
        "reference": op.reference,
        "source_location_id": op.source_location_id,
        "dest_location_id": op.dest_location_id,
        "supplier": op.supplier,
        "customer": op.customer,
        "created_by": op.created_by,
        "created_at": op.created_at,
        "items": items,
    }


def _serialize_operations(operations):
    result = []
    for op in operations:
        items = []
        for item in op.items:
            items.append({
                "id": item.id,
                "product_id": item.product_id,
                "product_name": item.product.name if item.product else None,
                "quantity": item.quantity,
            })
        result.append({
            "id": op.id,
            "type": op.type,
            "status": op.status,
            "reference": op.reference,
            "source_location_id": op.source_location_id,
            "dest_location_id": op.dest_location_id,
            "supplier": op.supplier,
            "customer": op.customer,
            "created_by": op.created_by,
            "created_at": op.created_at,
            "items": items,
        })
    return result

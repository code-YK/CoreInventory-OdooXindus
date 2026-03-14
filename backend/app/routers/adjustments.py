from uuid import UUID
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload
from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.operation import Operation
from app.models.operation_item import OperationItem
from app.schemas.operation import AdjustmentCreate, OperationResponse
from app.services import adjustment_service

router = APIRouter(prefix="/adjustments", tags=["Adjustments"])


@router.get("", response_model=list[OperationResponse])
def list_adjustments(
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    operations = adjustment_service.list_adjustments(db, filter_status=status)
    return _serialize_operations(operations)


@router.post("", response_model=OperationResponse)
def create_adjustment(
    data: AdjustmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    operation = adjustment_service.create_adjustment(
        location_id=data.location_id,
        items=data.items,
        user_id=current_user.id,
        db=db,
    )
    return _serialize_operation(operation, db)


@router.put("/{adjustment_id}/done", response_model=OperationResponse)
def done_adjustment(
    adjustment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    operation = adjustment_service.done_adjustment(adjustment_id, db)
    return _serialize_operation(operation, db)


def _serialize_operation(operation, db: Session):
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

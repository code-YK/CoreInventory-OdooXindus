from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload
from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.operation import Operation
from app.models.operation_item import OperationItem
from app.schemas.operation import HistoryResponse

router = APIRouter(prefix="/history", tags=["History"])


@router.get("", response_model=list[HistoryResponse])
def list_history(
    type: Optional[str] = Query(None),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = (
        db.query(Operation)
        .filter(Operation.status == "done")
        .options(
            joinedload(Operation.items).joinedload(OperationItem.product),
            joinedload(Operation.source_location),
            joinedload(Operation.dest_location),
            joinedload(Operation.creator),
        )
    )

    if type:
        query = query.filter(Operation.type == type)
    if date_from:
        query = query.filter(Operation.created_at >= date_from)
    if date_to:
        query = query.filter(Operation.created_at <= date_to)

    operations = query.order_by(Operation.created_at.desc()).all()

    result = []
    for op in operations:
        items = []
        for item in op.items:
            items.append({
                "product_name": item.product.name if item.product else "",
                "quantity": item.quantity,
            })

        result.append({
            "id": op.id,
            "reference": op.reference,
            "type": op.type,
            "status": op.status,
            "created_by_email": op.creator.email if op.creator else "",
            "created_at": op.created_at,
            "source_location_name": op.source_location.name if op.source_location else None,
            "dest_location_name": op.dest_location.name if op.dest_location else None,
            "items": items,
        })

    return result

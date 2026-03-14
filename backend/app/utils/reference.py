from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.operation import Operation


def generate_reference(prefix: str, db: Session) -> str:
    """
    Generate auto-incrementing reference numbers like REC-0001, DEL-0001, etc.
    Queries the max existing reference for the given prefix and increments.
    """
    last_ref = (
        db.query(Operation.reference)
        .filter(Operation.reference.like(f"{prefix}-%"))
        .order_by(Operation.reference.desc())
        .first()
    )

    if last_ref and last_ref[0]:
        try:
            last_num = int(last_ref[0].split("-")[1])
            next_num = last_num + 1
        except (IndexError, ValueError):
            next_num = 1
    else:
        next_num = 1

    return f"{prefix}-{next_num:04d}"

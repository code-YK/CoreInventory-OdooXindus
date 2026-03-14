import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Enum, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


class Operation(Base):
    __tablename__ = "operations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    type = Column(
        Enum("receipt", "delivery", "transfer", "adjustment", name="operation_type"),
        nullable=False,
    )
    status = Column(
        Enum("draft", "confirmed", "done", "cancelled", name="operation_status"),
        nullable=False,
        default="draft",
    )
    reference = Column(String, unique=True, nullable=False, index=True)
    source_location_id = Column(UUID(as_uuid=True), ForeignKey("locations.id"), nullable=True)
    dest_location_id = Column(UUID(as_uuid=True), ForeignKey("locations.id"), nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Extra fields for receipts/deliveries
    supplier = Column(String, nullable=True)
    customer = Column(String, nullable=True)

    items = relationship("OperationItem", backref="operation", cascade="all, delete-orphan")
    source_location = relationship("Location", foreign_keys=[source_location_id])
    dest_location = relationship("Location", foreign_keys=[dest_location_id])
    creator = relationship("User", foreign_keys=[created_by])

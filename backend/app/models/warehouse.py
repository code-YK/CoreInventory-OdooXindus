import uuid
from sqlalchemy import Column, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


class Warehouse(Base):
    __tablename__ = "warehouses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    short_code = Column(String, unique=True, nullable=False)
    address = Column(String, nullable=True)

    locations = relationship("Location", backref="warehouse", cascade="all, delete-orphan")

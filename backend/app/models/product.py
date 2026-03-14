import uuid
from sqlalchemy import Column, String, Integer, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    sku = Column(String, unique=True, nullable=False, index=True)
    category_id = Column(UUID(as_uuid=True), ForeignKey("categories.id"), nullable=True)
    unit = Column(String, nullable=False, default="pcs")
    reorder_level = Column(Integer, nullable=False, default=0)
    is_active = Column(Boolean, nullable=False, default=True)

    category = relationship("Category", backref="products")

from uuid import UUID
from typing import Optional, List
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.product import Product


def list_products(
    db: Session,
    category_id: Optional[UUID] = None,
    search: Optional[str] = None,
) -> List[Product]:
    query = db.query(Product).filter(Product.is_active == True)

    if category_id:
        query = query.filter(Product.category_id == category_id)

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Product.name.ilike(search_term)) | (Product.sku.ilike(search_term))
        )

    return query.all()


def create_product(data: dict, db: Session) -> Product:
    existing = db.query(Product).filter(Product.sku == data["sku"]).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Product with SKU '{data['sku']}' already exists",
        )

    product = Product(**data)
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


def update_product(product_id: UUID, data: dict, db: Session) -> Product:
    product = db.query(Product).filter(Product.id == product_id, Product.is_active == True).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    for key, value in data.items():
        if value is not None:
            setattr(product, key, value)

    db.commit()
    db.refresh(product)
    return product


def delete_product(product_id: UUID, db: Session) -> dict:
    product = db.query(Product).filter(Product.id == product_id, Product.is_active == True).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    product.is_active = False
    db.commit()
    return {"detail": "Product deleted"}

from uuid import UUID
from typing import Optional, List
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from fastapi import HTTPException, status
from app.models.product import Product
from app.models.inventory import Inventory
from app.utils.search import HybridSearchProcessor

# Initialize hybrid search processor once
_hybrid_search = None


def _get_hybrid_search() -> HybridSearchProcessor:
    """
    Get or initialize hybrid search processor (lazy loading).
    Prevents model loading on every import.
    """
    global _hybrid_search
    if _hybrid_search is None:
        _hybrid_search = HybridSearchProcessor()
    return _hybrid_search


def list_products(
    db: Session,
    category_id: Optional[UUID] = None,
    search: Optional[str] = None,
) -> List[dict]:
    """
    List products with hybrid search algorithm.

    Algorithm Flow (when search query provided):
    1. Extract filters from user query (e.g., "available", "low stock")
    2. Run keyword search on name/SKU
    3. Run semantic search on product names
    4. Merge and deduplicate results (combining both search types)
    5. Apply extracted filters to final results

    Args:
        db: Database session
        category_id: Optional filter by category
        search: Optional search query for hybrid search

    Returns:
        List of products with search scores if search provided
    """
    # Base query: active products only
    query = db.query(Product).filter(Product.is_active == True)

    if category_id:
        query = query.filter(Product.category_id == category_id)

    # Get all products from category filter
    products = query.all()

    # If search query provided, use hybrid search algorithm
    if search and products:
        # Enrich products with inventory data for filtering
        enriched_products = _enrich_products_with_inventory(products, db)

        # Perform hybrid search
        hybrid_engine = _get_hybrid_search()
        search_result = hybrid_engine.hybrid_search(
            query=search,
            products=enriched_products,
            semantic_threshold=0.5  # Configurable threshold
        )

        # Return enriched results with search metadata
        return _format_search_results(search_result["results"], with_scores=True)

    # No search query: return products with basic info
    return _format_search_results(products, with_scores=False)


def _enrich_products_with_inventory(products: List[Product], db: Session) -> List[dict]:
    """
    Enrich product objects with inventory data for filtering.
    Aggregates inventory across all locations.

    Returns:
        List of product dicts with total quantity and reorder_level
    """
    enriched = []

    for product in products:
        # Get total inventory across all locations
        total_qty = (
            db.query(func.coalesce(func.sum(Inventory.quantity), 0))
            .filter(Inventory.product_id == product.id)
            .scalar()
        )

        enriched.append({
            "id": product.id,
            "name": product.name,
            "sku": product.sku,
            "category_id": product.category_id,
            "unit": product.unit,
            "reorder_level": product.reorder_level,
            "is_active": product.is_active,
            "quantity": total_qty or 0,  # Total across locations
            "_original": product  # Keep reference for formatting
        })

    return enriched


def _format_search_results(products: List, with_scores: bool = False) -> List[dict]:
    """
    Format product results for API response.

    Args:
        products: List of product objects or dicts
        with_scores: Include search scores in response

    Returns:
        Formatted product list
    """
    results = []

    for product in products:
        # Handle both Product objects and dicts (from hybrid search)
        if isinstance(product, dict):
            # Result from hybrid search
            results.append({
                "id": str(product.get("id")),
                "name": product.get("name"),
                "sku": product.get("sku"),
                "category_id": str(product.get("category_id")) if product.get("category_id") else None,
                "unit": product.get("unit"),
                "reorder_level": product.get("reorder_level"),
                "is_active": product.get("is_active"),
                **({"search_scores": {
                    "keyword": round(product.get("keyword_score", 0.0), 3),
                    "semantic": round(product.get("semantic_score", 0.0), 3),
                    "combined": round(product.get("combined_score", 0.0), 3)
                }} if with_scores else {})
            })
        else:
            # Product ORM object
            results.append({
                "id": str(product.id),
                "name": product.name,
                "sku": product.sku,
                "category_id": str(product.category_id) if product.category_id else None,
                "unit": product.unit,
                "reorder_level": product.reorder_level,
                "is_active": product.is_active
            })

    return results


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

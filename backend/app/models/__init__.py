# Import all models so that Alembic and Base.metadata can discover them
from app.models.user import User
from app.models.category import Category
from app.models.product import Product
from app.models.warehouse import Warehouse
from app.models.location import Location
from app.models.inventory import Inventory
from app.models.operation import Operation
from app.models.operation_item import OperationItem

__all__ = [
    "User",
    "Category",
    "Product",
    "Warehouse",
    "Location",
    "Inventory",
    "Operation",
    "OperationItem",
]

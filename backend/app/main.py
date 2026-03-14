from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import (
    auth,
    products,
    categories,
    warehouses,
    inventory,
    receipts,
    deliveries,
    transfers,
    adjustments,
    history,
    dashboard,
)

app = FastAPI(
    title="CoreInventory",
    description="Modular Inventory Management System",
    version="1.0.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all routers
app.include_router(auth.router)
app.include_router(products.router)
app.include_router(categories.router)
app.include_router(warehouses.router)
app.include_router(inventory.router)
app.include_router(receipts.router)
app.include_router(deliveries.router)
app.include_router(transfers.router)
app.include_router(adjustments.router)
app.include_router(history.router)
app.include_router(dashboard.router)


@app.get("/")
def root():
    return {"message": "CoreInventory API is running"}

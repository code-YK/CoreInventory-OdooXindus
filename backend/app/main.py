from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi

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
    description="Modular Inventory Management System with JWT Bearer Token Authentication",
    version="1.0.0",
    contact={
        "name": "CoreInventory Support",
        "url": "http://localhost:8000/docs",
    },
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


def custom_openapi():
    """
    Custom OpenAPI schema with security documentation.
    Adds JWT Bearer Token authorization details.
    """
    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(
        title="CoreInventory",
        version="1.0.0",
        description="""
        Inventory Management System API with JWT Bearer Token Authentication.

        ## Authentication
        All endpoints except `/auth/signup` and `/auth/login` require JWT Bearer Token authentication.

        ### How to get a token:
        1. **Sign up a new user**: POST `/auth/signup` with email and password
        2. **Login**: POST `/auth/login` with email and password
        3. Response contains `access_token` field

        ### How to use the token:
        Add the token to the Authorization header:
        ```
        Authorization: Bearer <your_token_here>
        ```

        ### Token Expiration:
        Default token expiration is 24 hours (configurable via JWT_SECRET in .env)

        ### Public Endpoints (No token required):
        - POST `/auth/signup` - Create new user account
        - POST `/auth/login` - Login and get token
        - POST `/auth/reset-password` - Reset forgot password

        ### Protected Endpoints (Bearer token required):
        - All endpoints under `/products`, `/categories`, `/warehouses`, `/inventory`
        - All endpoints under `/receipts`, `/deliveries`, `/transfers`, `/adjustments`
        - All endpoints under `/history`, `/dashboard`
        """,
        routes=app.routes,
    )

    # Add security scheme definition
    openapi_schema["components"]["securitySchemes"] = {
        "bearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
            "description": "JWT Bearer token. Required for all endpoints except /auth/signup and /auth/login"
        }
    }

    # Apply security to all endpoints except auth endpoints
    for path, path_item in openapi_schema["paths"].items():
        if not path.startswith("/auth"):
            for operation in path_item.values():
                if isinstance(operation, dict):
                    operation["security"] = [{"bearerAuth": []}]

    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = custom_openapi


@app.get("/")
def root():
    return {
        "message": "CoreInventory API is running",
        "docs": "Visit http://localhost:8000/docs for API documentation",
        "authentication": "All endpoints except /auth/* require JWT Bearer token",
        "get_started": "POST /auth/signup to create account or POST /auth/login to login"
    }

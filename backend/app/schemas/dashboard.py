from pydantic import BaseModel


class KPIResponse(BaseModel):
    total_products: int
    low_stock_count: int
    pending_receipts: int
    pending_deliveries: int
    pending_transfers: int

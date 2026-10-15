from datetime import date
from typing import List

from pydantic import BaseModel


class Purchase(BaseModel):
    product_id: int
    purchase_date: date
    quantity: int


class PredictionRequest(BaseModel):
    user_id: int
    product_id: int
    purchases: List[Purchase]

    category_type: str = "FOOD"
    reminder_interval_days: float = 7


class PredictionResponse(BaseModel):
    user_id: int
    product_id: int
    predicted_next_date: date
    predicted_days: float
    confidence: float
    type: str
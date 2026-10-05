from pydantic import BaseModel
from typing import List
from datetime import date


class Purchase(BaseModel):
    product_id: int
    purchase_date: date
    quantity: int


class PredictionRequest(BaseModel):
    user_id: int
    product_id: int
    purchases: List[Purchase]


class PredictionResponse(BaseModel):
    user_id: int
    product_id: int
    predicted_next_date: date
    predicted_days: float
    confidence: float
    type: str
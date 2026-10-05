from fastapi import FastAPI, HTTPException

from src.schemas import (
    PredictionRequest,
    PredictionResponse
)

from src.predictor import predict_next_purchase


app = FastAPI(
    title="Smart Grocery AI Service",
    description="AI dự đoán thời điểm khách hàng mua lại sản phẩm",
    version="1.0.0"
)


@app.get("/")
def root():
    return {
        "message": "Smart Grocery AI Service is running"
    }


@app.get("/health")
def health():
    return {
        "status": "OK"
    }


@app.post(
    "/api/ai/predict",
    response_model=PredictionResponse
)
def predict(request: PredictionRequest):

    try:

        purchases = [
            purchase
            for purchase in request.purchases
            if purchase.product_id == request.product_id
        ]

        if len(purchases) < 2:
            raise HTTPException(
                status_code=400,
                detail="Khách hàng cần ít nhất 2 lần mua sản phẩm này."
            )

        result = predict_next_purchase(purchases)

        return PredictionResponse(
            user_id=request.user_id,
            product_id=request.product_id,
            predicted_next_date=result["predicted_next_date"],
            predicted_days=result["predicted_days"],
            confidence=result["confidence"],
            type="REPLENISHMENT"
        )

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
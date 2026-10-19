from fastapi.testclient import TestClient
from src.main import app

client = TestClient(app)


def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    assert "running" in response.json().get("message", "")


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "OK"}


def test_predict_valid_payload():
    payload = {
        "user_id": 1,
        "product_id": 10,
        "purchases": [
            {"product_id": 10, "purchase_date": "2026-10-01", "quantity": 2},
            {"product_id": 10, "purchase_date": "2026-10-08", "quantity": 1},
            {"product_id": 10, "purchase_date": "2026-10-15", "quantity": 2}
        ],
        "category_type": "FOOD",
        "reminder_interval_days": 7
    }
    response = client.post("/api/ai/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["user_id"] == 1
    assert data["product_id"] == 10
    assert data["type"] == "REPLENISHMENT"
    assert "predicted_next_date" in data
    assert "predicted_days" in data
    assert 0.5 <= data["confidence"] <= 1.0


def test_predict_insufficient_purchases_returns_400():
    payload = {
        "user_id": 1,
        "product_id": 10,
        "purchases": [
            {"product_id": 10, "purchase_date": "2026-10-01", "quantity": 1}
        ],
        "category_type": "FOOD",
        "reminder_interval_days": 7
    }
    response = client.post("/api/ai/predict", json=payload)
    assert response.status_code == 400
    assert "ít nhất 2 lần" in response.json().get("detail", "")


def test_predict_invalid_schema_returns_422():
    payload = {
        "user_id": "invalid_user_id"
    }
    response = client.post("/api/ai/predict", json=payload)
    assert response.status_code == 422

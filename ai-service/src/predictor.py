import os
import joblib

from datetime import timedelta


# Đường dẫn tới model
MODEL_PATH = os.path.join(
    os.path.dirname(os.path.dirname(__file__)),
    "models",
    "purchase_model.joblib"
)

model = joblib.load(MODEL_PATH)


def predict_next_purchase(purchases):

    if len(purchases) < 2:
        raise ValueError(
            "Cần ít nhất 2 lần mua để dự đoán."
        )

    purchases = sorted(
        purchases,
        key=lambda x: x.purchase_date
    )

    # =========================
    # TÍNH CÁC FEATURE
    # =========================

    intervals = []

    for i in range(1, len(purchases)):

        days = (
            purchases[i].purchase_date
            - purchases[i - 1].purchase_date
        ).days

        if days > 0:
            intervals.append(days)

    if not intervals:
        raise ValueError(
            "Không thể tính khoảng cách giữa các lần mua."
        )

    purchase_count = len(purchases)

    average_interval = sum(intervals) / len(intervals)

    last_interval = intervals[-1]

    last_purchase_date = purchases[-1].purchase_date

    # Tính số ngày từ lần mua cuối tới hôm nay
    from datetime import date

    days_since_last_purchase = (
        date.today() - last_purchase_date
    ).days

    quantities = [
        purchase.quantity
        for purchase in purchases
    ]

    average_quantity = (
        sum(quantities) / len(quantities)
    )

    last_quantity = quantities[-1]

    # =========================
    # TẠO INPUT CHO MODEL
    # =========================

    features = [[
        purchase_count,
        days_since_last_purchase,
        average_interval,
        last_interval,
        average_quantity,
        last_quantity
    ]]

    # =========================
    # ML PREDICTION
    # =========================

    predicted_days = model.predict(
        features
    )[0]

    predicted_days = max(
        1,
        round(float(predicted_days), 2)
    )

    predicted_date = (
        last_purchase_date
        + timedelta(
            days=round(predicted_days)
        )
    )

    return {
        "predicted_next_date": predicted_date,
        "predicted_days": predicted_days,

        # Đây là điểm ổn định dựa trên độ chính xác
        # của model, KHÔNG phải xác suất.
        "confidence": 0.80
    }
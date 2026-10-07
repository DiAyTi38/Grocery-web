import os
from datetime import timedelta

import joblib


MODEL_PATH = os.path.join(
    os.path.dirname(os.path.dirname(__file__)),
    "models",
    "purchase_model.joblib",
)

FEATURES = [
    "purchase_count",
    "average_interval",
    "last_interval",
    "average_quantity",
    "last_quantity",
    "category_type",
    "reminder_interval_days",
]

CATEGORY_TYPE_MAP = {
    "FOOD": 0,
    "COSMETIC": 1,
    "CONSUMER": 2,
}

model = joblib.load(MODEL_PATH)


def predict_next_purchase(
    purchases,
    category_type="FOOD",
    reminder_interval_days=7,
):
    if len(purchases) < 2:
        raise ValueError("Cần ít nhất 2 lần mua để dự đoán.")

    purchases = sorted(
        purchases,
        key=lambda x: x.purchase_date
    )

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

    quantities = [
        p.quantity for p in purchases
    ]

    category_code = category_type.upper()

    if category_code not in CATEGORY_TYPE_MAP:
        raise ValueError(
            f"Category không hợp lệ: {category_type}"
        )

    category_value = CATEGORY_TYPE_MAP[category_code]

    features = [[
        len(purchases),
        sum(intervals) / len(intervals),
        intervals[-1],
        sum(quantities) / len(quantities),
        quantities[-1],
        category_value,
        reminder_interval_days,
    ]]

    predicted_days = max(
        1,
        round(float(model.predict(features)[0]), 2)
    )

    last_purchase_date = purchases[-1].purchase_date

    predicted_date = (
        last_purchase_date
        + timedelta(days=round(predicted_days))
    )

    return {
        "predicted_next_date": predicted_date,
        "predicted_days": predicted_days,
        "confidence": 0.80,
    }
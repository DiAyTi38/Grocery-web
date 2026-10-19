import os
from datetime import timedelta

import joblib
import numpy as np
import pandas as pd


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


def calculate_confidence(
    intervals,
    quantities,
    tree_predictions,
    reminder_interval_days=7.0,
):
    """
    Tính độ tin cậy (confidence) biến thiên theo tỷ lệ thay vì cố định:
    1. Tỷ lệ biến thiên chu kỳ mua (Interval Coefficient of Variation - CV).
    2. Tỷ lệ biến thiên giữa các cây trong Random Forest (Model uncertainty).
    3. Tỷ lệ biến thiên số lượng mua (Quantity stability).
    4. Trọng số số lượng lần mua (Sample size factor).
    """
    purchase_count = len(quantities)

    # 1. Tỷ lệ biến thiên chu kỳ mua (CV = std / mean)
    if len(intervals) >= 2:
        mean_int = float(np.mean(intervals))
        std_int = float(np.std(intervals, ddof=1))
        cv_int = std_int / max(mean_int, 1.0)
        interval_score = 1.0 / (1.0 + cv_int)
    else:
        # Nếu chỉ có 1 khoảng cách (2 lần mua), so sánh với reminder_interval_days
        diff = abs(intervals[0] - reminder_interval_days)
        rel_diff = diff / max(float(intervals[0]), float(reminder_interval_days), 1.0)
        interval_score = 1.0 / (1.0 + rel_diff)

    # 2. Tỷ lệ biến thiên giữa các cây quyết định trong Random Forest
    if len(tree_predictions) > 0:
        mean_tree = float(np.mean(tree_predictions))
        std_tree = float(np.std(tree_predictions))
        cv_tree = std_tree / max(mean_tree, 1.0)
        tree_score = 1.0 / (1.0 + cv_tree)
    else:
        tree_score = 0.85

    # 3. Tỷ lệ biến thiên số lượng sản phẩm mỗi lần mua
    if len(quantities) >= 2:
        mean_qty = float(np.mean(quantities))
        std_qty = float(np.std(quantities, ddof=1))
        cv_qty = std_qty / max(mean_qty, 1.0)
        qty_score = 1.0 / (1.0 + cv_qty)
    else:
        qty_score = 1.0

    # 4. Trọng số dựa trên số lần mua tích lũy (khách mua càng nhiều lần thì dữ liệu càng chắc chắn)
    sample_factor = 0.70 + 0.30 * min(1.0, max(0.0, (purchase_count - 2) / 4.0))

    # Tổng hợp tỷ lệ độ tin cậy theo trọng số các yếu tố
    base_confidence = (
        0.50 * interval_score
        + 0.35 * tree_score
        + 0.15 * qty_score
    )
    final_confidence = base_confidence * sample_factor

    # Giới hạn trong khoảng thực tế hợp lệ [0.35, 0.98] và làm tròn 2 chữ số thập phân
    bounded = max(0.35, min(0.98, final_confidence))
    return round(bounded, 2)


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

    features_df = pd.DataFrame(features, columns=FEATURES)
    features_np = features_df.to_numpy()

    predicted_days = max(
        1,
        round(float(model.predict(features_df)[0]), 2)
    )

    # Lấy dự đoán từ các cây trong ensemble để đo độ phân tán
    if hasattr(model, "estimators_"):
        tree_predictions = [
            float(tree.predict(features_np)[0])
            for tree in model.estimators_
        ]
    else:
        tree_predictions = [predicted_days]

    # Tính confidence biến thiên theo tỷ lệ
    confidence = calculate_confidence(
        intervals=intervals,
        quantities=quantities,
        tree_predictions=tree_predictions,
        reminder_interval_days=reminder_interval_days,
    )

    last_purchase_date = purchases[-1].purchase_date

    predicted_date = (
        last_purchase_date
        + timedelta(days=round(predicted_days))
    )

    return {
        "predicted_next_date": predicted_date,
        "predicted_days": predicted_days,
        "confidence": confidence,
    }
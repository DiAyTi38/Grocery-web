import os
import joblib
import pandas as pd

from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error


# =========================
# 1. DỮ LIỆU TRAINING MẪU
# =========================

data = {
    "purchase_count": [
        2, 3, 4, 5, 6,
        3, 4, 5, 6, 7,
        2, 4, 5, 7, 8
    ],

    "days_since_last_purchase": [
        6, 5, 7, 6, 8,
        10, 9, 11, 8, 12,
        5, 7, 9, 10, 13
    ],

    "average_interval": [
        7, 7, 7, 7, 8,
        10, 9, 11, 8, 12,
        5, 7, 9, 10, 13
    ],

    "last_interval": [
        7, 6, 8, 7, 8,
        10, 9, 12, 8, 13,
        5, 7, 8, 11, 14
    ],

    "average_quantity": [
        2, 2, 3, 2, 3,
        1, 2, 2, 3, 2,
        1, 2, 3, 2, 3
    ],

    "last_quantity": [
        2, 2, 3, 2, 3,
        1, 2, 2, 3, 2,
        1, 2, 3, 2, 3
    ],

    # Giá trị cần model dự đoán
    "days_to_next_purchase": [
        7, 7, 8, 7, 9,
        10, 9, 11, 8, 12,
        5, 7, 9, 11, 14
    ]
}


df = pd.DataFrame(data)


# =========================
# 2. FEATURES
# =========================

features = [
    "purchase_count",
    "days_since_last_purchase",
    "average_interval",
    "last_interval",
    "average_quantity",
    "last_quantity"
]

X = df[features]
y = df["days_to_next_purchase"]


# =========================
# 3. CHIA TRAIN / TEST
# =========================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42
)


# =========================
# 4. TRAIN RANDOM FOREST
# =========================

model = RandomForestRegressor(
    n_estimators=100,
    random_state=42
)

model.fit(X_train, y_train)


# =========================
# 5. ĐÁNH GIÁ MODEL
# =========================

predictions = model.predict(X_test)

mae = mean_absolute_error(
    y_test,
    predictions
)

print("=" * 60)
print("SMART GROCERY - ML MODEL")
print("=" * 60)

print(f"Training samples: {len(X_train)}")
print(f"Testing samples: {len(X_test)}")
print(f"MAE: {mae:.2f} days")


# =========================
# 6. LƯU MODEL
# =========================

os.makedirs("models", exist_ok=True)

model_path = "models/purchase_model.joblib"

joblib.dump(
    model,
    model_path
)

print()
print(f"Model saved: {model_path}")
print("=" * 60)
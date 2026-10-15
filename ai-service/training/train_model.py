import os

import joblib
import mysql.connector
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error
from sklearn.model_selection import train_test_split


# =========================================================
# FEATURES
# =========================================================

FEATURES = [
    "purchase_count",
    "average_interval",
    "last_interval",
    "average_quantity",
    "last_quantity",
    "category_type",
    "reminder_interval_days",
]


# =========================================================
# DATABASE CONFIG
# =========================================================

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": int(os.getenv("DB_PORT", "3306")),
    "database": os.getenv("DB_NAME", "smart_grocery"),
    "user": os.getenv("DB_USERNAME", "root"),
    "password": os.getenv("DB_PASSWORD", "root"),
}


# =========================================================
# CATEGORY
# =========================================================

CATEGORY_TYPE_MAP = {
    "FOOD": 0,
    "COSMETIC": 1,
    "CONSUMER": 2,
}


# =========================================================
# 1. LOAD PURCHASE HISTORY FROM MYSQL
# =========================================================

def load_purchase_history():
    conn = mysql.connector.connect(**DB_CONFIG)

    try:
        query = """
            SELECT
                ph.user_id,
                ph.product_id,
                ph.quantity,
                ph.purchase_date,

                p.category_id,

                c.category_code AS child_category_code,
                c.parent_id AS category_parent_id,
                c.reminder_interval_days AS child_reminder_interval_days,

                parent.category_code AS root_category_code,
                parent.reminder_interval_days AS root_reminder_interval_days

            FROM purchase_history ph

            JOIN products p
                ON ph.product_id = p.id

            JOIN categories c
                ON p.category_id = c.id

            LEFT JOIN categories parent
                ON c.parent_id = parent.id

            WHERE ph.purchase_date IS NOT NULL

            ORDER BY
                ph.user_id,
                ph.product_id,
                ph.purchase_date
        """

        history = pd.read_sql(query, conn)

        return history

    finally:
        conn.close()


# =========================================================
# 2. BUILD TRAINING DATASET
# =========================================================

def build_training_dataset(history: pd.DataFrame) -> pd.DataFrame:

    rows = []

    for (user_id, product_id), group in history.groupby(
        ["user_id", "product_id"]
    ):

        group = group.sort_values(
            "purchase_date"
        ).copy()

        group["purchase_date"] = pd.to_datetime(
            group["purchase_date"]
        )

        # Cần ít nhất 3 lần mua:
        # lần 1 + lần 2 để tạo interval
        # lần 3 làm target
        if len(group) < 3:
            continue

        quantities = (
            group["quantity"]
            .astype(float)
            .tolist()
        )

        dates = (
            group["purchase_date"]
            .tolist()
        )

        # =====================================================
        # CATEGORY
        # =====================================================

        child_category = group[
            "child_category_code"
        ].iloc[0]

        root_category = group[
            "root_category_code"
        ].iloc[0]

        # Nếu có parent thì dùng category gốc
        if pd.notna(root_category):
            category_code = str(
                root_category
            ).strip().upper()

            reminder_interval = group[
                "root_reminder_interval_days"
            ].iloc[0]

        # Nếu không có parent thì sản phẩm nằm trực tiếp
        # trong category gốc
        else:
            category_code = str(
                child_category
            ).strip().upper()

            reminder_interval = group[
                "child_reminder_interval_days"
            ].iloc[0]

        # Không nhận diện được category
        if category_code not in CATEGORY_TYPE_MAP:
            print(
                f"WARNING: Unknown category "
                f"'{category_code}' "
                f"for product_id={product_id}"
            )
            continue

        category_type = CATEGORY_TYPE_MAP[
            category_code
        ]

        # Không có reminder interval
        if pd.isna(reminder_interval):
            print(
                f"WARNING: Missing reminder interval "
                f"for product_id={product_id}"
            )
            continue

        reminder_interval = float(
            reminder_interval
        )

        # =====================================================
        # CREATE TRAINING SAMPLES
        # =====================================================

        # Ví dụ:
        #
        # purchase 1 -> purchase 2
        # purchase 1 + 2 -> purchase 3
        #
        # Dùng lịch sử trước đó để dự đoán lần mua tiếp theo.

        for i in range(1, len(group) - 1):

            previous_dates = dates[
                : i + 1
            ]

            # Tính khoảng cách giữa các lần mua
            intervals = []

            for j in range(
                1,
                len(previous_dates)
            ):

                interval = (
                    previous_dates[j]
                    - previous_dates[j - 1]
                ).days

                if interval > 0:
                    intervals.append(
                        interval
                    )

            if not intervals:
                continue

            # Số ngày thực tế đến lần mua tiếp theo
            target = (
                dates[i + 1]
                - dates[i]
            ).days

            if target <= 0:
                continue

            # Lịch sử số lượng mua
            previous_quantities = quantities[
                : i + 1
            ]

            # =================================================
            # ADD TRAINING ROW
            # =================================================

            rows.append({

                "user_id":
                    user_id,

                "product_id":
                    product_id,

                "purchase_count":
                    i + 1,

                "average_interval":
                    sum(intervals)
                    / len(intervals),

                "last_interval":
                    intervals[-1],

                "average_quantity":
                    sum(previous_quantities)
                    / len(previous_quantities),

                "last_quantity":
                    previous_quantities[-1],

                "category_type":
                    category_type,

                "reminder_interval_days":
                    reminder_interval,

                "days_to_next_purchase":
                    target,
            })

    return pd.DataFrame(rows)


# =========================================================
# 3. MAIN
# =========================================================

def main():

    print("=" * 70)
    print(
        "SMART GROCERY - "
        "TRAIN FROM MYSQL PURCHASE HISTORY"
    )
    print("=" * 70)

    print(
        f"Database: "
        f"{DB_CONFIG['database']}"
        f"@{DB_CONFIG['host']}"
        f":{DB_CONFIG['port']}"
    )

    # =====================================================
    # LOAD DATABASE
    # =====================================================

    print("\n[1] Loading purchase history...")

    history = load_purchase_history()

    print(
        f"Purchase history rows: "
        f"{len(history)}"
    )

    if history.empty:
        raise RuntimeError(
            "purchase_history không có dữ liệu."
        )

    # =====================================================
    # DEBUG CATEGORY DATA
    # =====================================================

    print("\n[2] Category data loaded from MySQL:")

    category_debug = (
        history[
            [
                "product_id",
                "child_category_code",
                "root_category_code",
                "root_reminder_interval_days",
            ]
        ]
        .drop_duplicates()
        .sort_values("product_id")
    )

    print(
        category_debug.to_string(
            index=False
        )
    )

    # =====================================================
    # BUILD TRAINING DATASET
    # =====================================================

    print("\n[3] Building training dataset...")

    dataset = build_training_dataset(
        history
    )

    if dataset.empty:
        raise RuntimeError(
            "Không tạo được training dataset."
        )

    if len(dataset) < 10:
        raise RuntimeError(
            f"Không đủ dữ liệu để train. "
            f"Training samples hiện tại: {len(dataset)}"
        )

    print(
        f"Training dataset rows: "
        f"{len(dataset)}"
    )

    # =====================================================
    # CATEGORY DISTRIBUTION
    # =====================================================

    print(
        "\n[4] Category distribution:"
    )

    category_distribution = (
        dataset[
            [
                "category_type",
                "reminder_interval_days",
            ]
        ]
        .drop_duplicates()
        .sort_values(
            "category_type"
        )
    )

    print(
        category_distribution.to_string(
            index=False
        )
    )

    # =====================================================
    # SHOW CATEGORY COUNTS
    # =====================================================

    print(
        "\nCategory sample counts:"
    )

    category_counts = (
        dataset["category_type"]
        .value_counts()
        .sort_index()
    )

    category_names = {
        0: "FOOD",
        1: "COSMETIC",
        2: "CONSUMER",
    }

    for category_type, count in (
        category_counts.items()
    ):

        category_name = category_names.get(
            category_type,
            "UNKNOWN"
        )

        print(
            f"  {category_name}: "
            f"{count} samples"
        )

    # =====================================================
    # SAVE DATASET
    # =====================================================

    data_dir = os.path.normpath(
        os.path.join(
            os.path.dirname(__file__),
            "../data"
        )
    )

    os.makedirs(
        data_dir,
        exist_ok=True
    )

    dataset_path = os.path.join(
        data_dir,
        "purchase_training_dataset.csv"
    )

    dataset.to_csv(
        dataset_path,
        index=False
    )

    print(
        f"\nDataset saved: "
        f"{dataset_path}"
    )

    # =====================================================
    # PREPARE X / Y
    # =====================================================

    X = dataset[
        FEATURES
    ]

    y = dataset[
        "days_to_next_purchase"
    ]

    # =====================================================
    # TRAIN / TEST SPLIT
    # =====================================================

    test_size = 0.2

    X_train, X_test, y_train, y_test = (
        train_test_split(
            X,
            y,
            test_size=test_size,
            random_state=42,
        )
    )

    print(
        f"\nTraining samples: "
        f"{len(X_train)}"
    )

    print(
        f"Testing samples: "
        f"{len(X_test)}"
    )

    # =====================================================
    # RANDOM FOREST
    # =====================================================

    print(
        "\n[5] Training Random Forest..."
    )

    model = RandomForestRegressor(
        n_estimators=200,
        random_state=42,
        min_samples_leaf=2,
        n_jobs=-1,
    )

    model.fit(
        X_train,
        y_train
    )

    # =====================================================
    # EVALUATE
    # =====================================================

    print(
        "\n[6] Evaluating model..."
    )

    predictions = model.predict(
        X_test
    )

    mae = mean_absolute_error(
        y_test,
        predictions
    )

    print(
        f"MAE: {mae:.2f} days"
    )

    # =====================================================
    # FEATURE IMPORTANCE
    # =====================================================

    print(
        "\nFeature importance:"
    )

    importance = pd.DataFrame({
        "feature": FEATURES,
        "importance":
            model.feature_importances_,
    })

    importance = (
        importance
        .sort_values(
            "importance",
            ascending=False,
        )
    )

    print(
        importance.to_string(
            index=False
        )
    )

    # =====================================================
    # SAVE MODEL
    # =====================================================

    model_dir = os.path.normpath(
        os.path.join(
            os.path.dirname(__file__),
            "../models"
        )
    )

    os.makedirs(
        model_dir,
        exist_ok=True
    )

    model_path = os.path.join(
        model_dir,
        "purchase_model.joblib"
    )

    joblib.dump(
        model,
        model_path
    )

    print(
        f"\nModel saved: "
        f"{model_path}"
    )

    print("=" * 70)
    print(
        "TRAINING COMPLETED"
    )
    print("=" * 70)


# =========================================================
# ENTRY POINT
# =========================================================

if __name__ == "__main__":
    main()
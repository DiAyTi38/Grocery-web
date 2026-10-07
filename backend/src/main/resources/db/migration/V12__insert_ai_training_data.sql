-- V12__insert_ai_training_data.sql
-- Synthetic purchase history for ML training

SET SESSION cte_max_recursion_depth = 2500;

INSERT INTO purchase_history
    (user_id, product_id, order_id, quantity, purchase_date, amount)

WITH RECURSIVE seq AS (
    SELECT 1 AS n

    UNION ALL

    SELECT n + 1
    FROM seq
    WHERE n < 2000
),

demo_users AS (
    SELECT
        id,
        ROW_NUMBER() OVER (ORDER BY id) - 1 AS user_idx
    FROM users
    WHERE username IN ('demo_an', 'demo_binh')
),

demo_products AS (
    SELECT
        id,
        price,
        ROW_NUMBER() OVER (ORDER BY id) - 1 AS product_idx
    FROM products
    WHERE sku IN (
        'DEMO-DRY-001',
        'DEMO-DRY-002',
        'DEMO-DRINK-001',
        'DEMO-DRINK-002',
        'DEMO-FRESH-001',
        'DEMO-FRESH-002'
    )
),

pairs AS (
    SELECT
        u.id AS user_id,
        p.id AS product_id,
        p.price,
        ROW_NUMBER() OVER (ORDER BY u.id, p.id) - 1 AS pair_idx
    FROM demo_users u
    CROSS JOIN demo_products p
),

purchase_data AS (
    SELECT
        s.n,
        pr.user_id,
        pr.product_id,
        pr.price,
        FLOOR((s.n - 1) / 12) AS purchase_round,
        MOD(s.n - 1, 12) AS variation
    FROM seq s
    JOIN pairs pr
        ON pr.pair_idx = MOD(s.n - 1, 12)
)

SELECT
    user_id,
    product_id,
    NULL AS order_id,
    1 + MOD(n + variation, 5) AS quantity,

    DATE_SUB(
        CURRENT_TIMESTAMP,
        INTERVAL (
            purchase_round * 8
            + MOD(variation, 4)
        ) DAY
    ) AS purchase_date,

    price * (1 + MOD(n + variation, 5)) AS amount

FROM purchase_data

ORDER BY
    user_id,
    product_id,
    purchase_date;
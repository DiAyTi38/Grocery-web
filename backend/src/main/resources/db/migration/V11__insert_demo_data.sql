-- V11__insert_demo_data.sql
-- Complete demo data for Smart Grocery + AI purchase prediction

-- =========================================================
-- 1. EXTEND CATEGORY TABLE FOR AI
-- =========================================================

ALTER TABLE categories
    ADD COLUMN parent_id BIGINT NULL AFTER id,
    ADD COLUMN category_code VARCHAR(50) NULL AFTER name,
    ADD COLUMN reminder_interval_days INT NOT NULL DEFAULT 7 AFTER category_code;

ALTER TABLE categories
    ADD CONSTRAINT uq_categories_code UNIQUE (category_code);

ALTER TABLE categories
    ADD CONSTRAINT fk_categories_parent
        FOREIGN KEY (parent_id)
        REFERENCES categories(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL;


-- =========================================================
-- 2. CATEGORY TREE
-- =========================================================

INSERT INTO categories
    (id, parent_id, name, category_code, reminder_interval_days, description)
VALUES
    (1, NULL, 'Food', 'FOOD', 7,
        'Food and beverage products'),

    (2, NULL, 'Cosmetic', 'COSMETIC', 30,
        'Personal care and cosmetic products'),

    (3, NULL, 'Consumer', 'CONSUMER', 15,
        'Household and consumer products'),

    (4, 1, 'Dry Food', 'FOOD_DRY', 14,
        'Rice, noodles and dry food'),

    (5, 1, 'Drinks', 'FOOD_DRINK', 7,
        'Milk, water and beverages'),

    (6, 1, 'Fresh Food', 'FOOD_FRESH', 5,
        'Fresh fruits and vegetables'),

    (7, 1, 'Meat and Fish', 'FOOD_MEAT_FISH', 5,
        'Meat and seafood'),

    (8, 1, 'Canned Food', 'FOOD_CANNED', 20,
        'Canned food'),

    (9, 2, 'Skin Care', 'COSMETIC_SKIN', 30,
        'Skin care products'),

    (10, 2, 'Hair Care', 'COSMETIC_HAIR', 30,
        'Hair care products'),

    (11, 2, 'Makeup', 'COSMETIC_MAKEUP', 60,
        'Makeup products'),

    (12, 2, 'Sun Care', 'COSMETIC_SUNCARE', 45,
        'Sun protection products'),

    (13, 3, 'Laundry', 'CONSUMER_LAUNDRY', 30,
        'Laundry products'),

    (14, 3, 'Cleaning', 'CONSUMER_CLEANING', 30,
        'Cleaning products'),

    (15, 3, 'Paper', 'CONSUMER_PAPER', 20,
        'Paper products'),

    (16, 3, 'Home', 'CONSUMER_HOME', 45,
        'Household products');


-- =========================================================
-- 3. DEMO USERS
-- password = password
-- BCrypt encoded
-- =========================================================

INSERT INTO users
    (username, email, password, full_name, role, phone, address, enabled)
VALUES
(
    'demo_an',
    'demo.an@example.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    'Demo An',
    'ROLE_USER',
    '0900000001',
    'Ha Noi',
    1
),
(
    'demo_binh',
    'demo.binh@example.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    'Demo Binh',
    'ROLE_USER',
    '0900000002',
    'Ha Noi',
    1
);


-- =========================================================
-- 4. PRODUCTS
-- 14 products covering 3 main categories
-- =========================================================

INSERT INTO products
    (category_id, sku, name, description, unit, price, image_url, active)
VALUES

-- FOOD
(
    4,
    'DEMO-FOOD-RICE-001',
    'ST25 Rice',
    'Premium Vietnamese rice',
    'kg',
    30000.00,
    '/images/products/rice.jpg',
    TRUE
),
(
    4,
    'DEMO-FOOD-NOODLE-001',
    'Instant Noodles',
    'Instant noodle pack',
    'pack',
    5000.00,
    '/images/products/noodles.jpg',
    TRUE
),
(
    5,
    'DEMO-FOOD-MILK-001',
    'Fresh Milk',
    'Fresh milk bottle',
    'bottle',
    35000.00,
    '/images/products/milk.jpg',
    TRUE
),
(
    5,
    'DEMO-FOOD-WATER-001',
    'Spring Water',
    'Drinking water',
    'bottle',
    7000.00,
    '/images/products/water.jpg',
    TRUE
),
(
    6,
    'DEMO-FOOD-APPLE-001',
    'Fresh Apple',
    'Fresh apple',
    'kg',
    60000.00,
    '/images/products/apple.jpg',
    TRUE
),
(
    6,
    'DEMO-FOOD-CARROT-001',
    'Fresh Carrot',
    'Fresh carrot',
    'kg',
    25000.00,
    '/images/products/carrot.jpg',
    TRUE
),

-- COSMETIC
(
    9,
    'DEMO-COS-SKIN-001',
    'Facial Cleanser',
    'Daily facial cleanser',
    'bottle',
    120000.00,
    '/images/products/cleanser.jpg',
    TRUE
),
(
    10,
    'DEMO-COS-HAIR-001',
    'Shampoo',
    'Daily shampoo',
    'bottle',
    150000.00,
    '/images/products/shampoo.jpg',
    TRUE
),
(
    11,
    'DEMO-COS-MAKEUP-001',
    'Lipstick',
    'Cosmetic lipstick',
    'piece',
    180000.00,
    '/images/products/lipstick.jpg',
    TRUE
),
(
    12,
    'DEMO-COS-SUN-001',
    'Sunscreen',
    'Daily sunscreen',
    'bottle',
    220000.00,
    '/images/products/sunscreen.jpg',
    TRUE
),

-- CONSUMER
(
    13,
    'DEMO-CON-LAUNDRY-001',
    'Laundry Detergent',
    'Laundry detergent',
    'bottle',
    180000.00,
    '/images/products/laundry.jpg',
    TRUE
),
(
    14,
    'DEMO-CON-CLEAN-001',
    'Floor Cleaner',
    'Floor cleaning solution',
    'bottle',
    90000.00,
    '/images/products/floor-cleaner.jpg',
    TRUE
),
(
    15,
    'DEMO-CON-PAPER-001',
    'Toilet Paper',
    'Toilet paper pack',
    'pack',
    65000.00,
    '/images/products/toilet-paper.jpg',
    TRUE
),
(
    16,
    'DEMO-CON-HOME-001',
    'Dishwashing Liquid',
    'Dishwashing liquid',
    'bottle',
    75000.00,
    '/images/products/dishwashing.jpg',
    TRUE
);


-- =========================================================
-- 5. INVENTORY
-- =========================================================

INSERT INTO inventory
    (product_id, quantity, reserved_quantity, low_stock_threshold)
SELECT
    id,
    100,
    0,
    5
FROM products
WHERE sku LIKE 'DEMO-%';


-- =========================================================
-- 6. DEMO ORDERS
-- 20 delivered orders
-- 10 orders/user
-- =========================================================

INSERT INTO orders
    (user_id, total_amount, status, created_at)

SELECT
    u.id,
    0.00,
    'DELIVERED',
    d.created_at
FROM
(
    SELECT 'demo_an' AS username, '2026-07-01 09:00:00' AS created_at
    UNION ALL SELECT 'demo_an', '2026-07-08 09:00:00'
    UNION ALL SELECT 'demo_an', '2026-07-15 09:00:00'
    UNION ALL SELECT 'demo_an', '2026-07-22 09:00:00'
    UNION ALL SELECT 'demo_an', '2026-08-01 09:00:00'
    UNION ALL SELECT 'demo_an', '2026-08-08 09:00:00'
    UNION ALL SELECT 'demo_an', '2026-08-15 09:00:00'
    UNION ALL SELECT 'demo_an', '2026-08-22 09:00:00'
    UNION ALL SELECT 'demo_an', '2026-09-01 09:00:00'
    UNION ALL SELECT 'demo_an', '2026-09-08 09:00:00'

    UNION ALL SELECT 'demo_binh', '2026-07-03 10:00:00'
    UNION ALL SELECT 'demo_binh', '2026-07-10 10:00:00'
    UNION ALL SELECT 'demo_binh', '2026-07-17 10:00:00'
    UNION ALL SELECT 'demo_binh', '2026-07-24 10:00:00'
    UNION ALL SELECT 'demo_binh', '2026-08-03 10:00:00'
    UNION ALL SELECT 'demo_binh', '2026-08-10 10:00:00'
    UNION ALL SELECT 'demo_binh', '2026-08-17 10:00:00'
    UNION ALL SELECT 'demo_binh', '2026-08-24 10:00:00'
    UNION ALL SELECT 'demo_binh', '2026-09-03 10:00:00'
    UNION ALL SELECT 'demo_binh', '2026-09-10 10:00:00'
) d
JOIN users u
    ON u.username = d.username;


-- =========================================================
-- 7. ORDER ITEMS
-- =========================================================

INSERT INTO order_items
    (order_id, product_id, quantity, unit_price, subtotal)

SELECT
    o.id,
    p.id,
    x.quantity,
    p.price,
    x.quantity * p.price
FROM
(
    -- demo_an
    SELECT 'demo_an' AS username, '2026-07-01 09:00:00' AS created_at,
           'DEMO-FOOD-RICE-001' AS sku, 2 AS quantity
    UNION ALL
    SELECT 'demo_an', '2026-07-01 09:00:00',
           'DEMO-FOOD-MILK-001', 1

    UNION ALL
    SELECT 'demo_an', '2026-07-08 09:00:00',
           'DEMO-FOOD-RICE-001', 1
    UNION ALL
    SELECT 'demo_an', '2026-07-08 09:00:00',
           'DEMO-FOOD-MILK-001', 2

    UNION ALL
    SELECT 'demo_an', '2026-07-15 09:00:00',
           'DEMO-FOOD-NOODLE-001', 5
    UNION ALL
    SELECT 'demo_an', '2026-07-15 09:00:00',
           'DEMO-FOOD-MILK-001', 1

    UNION ALL
    SELECT 'demo_an', '2026-07-22 09:00:00',
           'DEMO-FOOD-RICE-001', 2
    UNION ALL
    SELECT 'demo_an', '2026-07-22 09:00:00',
           'DEMO-COS-SKIN-001', 1

    UNION ALL
    SELECT 'demo_an', '2026-08-01 09:00:00',
           'DEMO-FOOD-RICE-001', 1
    UNION ALL
    SELECT 'demo_an', '2026-08-01 09:00:00',
           'DEMO-COS-HAIR-001', 1

    UNION ALL
    SELECT 'demo_an', '2026-08-08 09:00:00',
           'DEMO-FOOD-NOODLE-001', 4
    UNION ALL
    SELECT 'demo_an', '2026-08-08 09:00:00',
           'DEMO-FOOD-MILK-001', 1

    UNION ALL
    SELECT 'demo_an', '2026-08-15 09:00:00',
           'DEMO-CON-PAPER-001', 4
    UNION ALL
    SELECT 'demo_an', '2026-08-15 09:00:00',
           'DEMO-CON-LAUNDRY-001', 1

    UNION ALL
    SELECT 'demo_an', '2026-08-22 09:00:00',
           'DEMO-FOOD-RICE-001', 1
    UNION ALL
    SELECT 'demo_an', '2026-08-22 09:00:00',
           'DEMO-COS-SKIN-001', 1

    UNION ALL
    SELECT 'demo_an', '2026-09-01 09:00:00',
           'DEMO-FOOD-RICE-001', 2
    UNION ALL
    SELECT 'demo_an', '2026-09-01 09:00:00',
           'DEMO-COS-HAIR-001', 1

    UNION ALL
    SELECT 'demo_an', '2026-09-08 09:00:00',
           'DEMO-CON-PAPER-001', 4
    UNION ALL
    SELECT 'demo_an', '2026-09-08 09:00:00',
           'DEMO-CON-LAUNDRY-001', 1

    -- demo_binh
    UNION ALL
    SELECT 'demo_binh', '2026-07-03 10:00:00',
           'DEMO-FOOD-RICE-001', 2
    UNION ALL
    SELECT 'demo_binh', '2026-07-03 10:00:00',
           'DEMO-FOOD-MILK-001', 1

    UNION ALL
    SELECT 'demo_binh', '2026-07-10 10:00:00',
           'DEMO-FOOD-RICE-001', 1
    UNION ALL
    SELECT 'demo_binh', '2026-07-10 10:00:00',
           'DEMO-FOOD-MILK-001', 2

    UNION ALL
    SELECT 'demo_binh', '2026-07-17 10:00:00',
           'DEMO-FOOD-NOODLE-001', 5
    UNION ALL
    SELECT 'demo_binh', '2026-07-17 10:00:00',
           'DEMO-FOOD-MILK-001', 1

    UNION ALL
    SELECT 'demo_binh', '2026-07-24 10:00:00',
           'DEMO-FOOD-RICE-001', 2
    UNION ALL
    SELECT 'demo_binh', '2026-07-24 10:00:00',
           'DEMO-COS-SKIN-001', 1

    UNION ALL
    SELECT 'demo_binh', '2026-08-03 10:00:00',
           'DEMO-FOOD-RICE-001', 1
    UNION ALL
    SELECT 'demo_binh', '2026-08-03 10:00:00',
           'DEMO-COS-HAIR-001', 1

    UNION ALL
    SELECT 'demo_binh', '2026-08-10 10:00:00',
           'DEMO-FOOD-NOODLE-001', 4
    UNION ALL
    SELECT 'demo_binh', '2026-08-10 10:00:00',
           'DEMO-FOOD-MILK-001', 1

    UNION ALL
    SELECT 'demo_binh', '2026-08-17 10:00:00',
           'DEMO-CON-PAPER-001', 4
    UNION ALL
    SELECT 'demo_binh', '2026-08-17 10:00:00',
           'DEMO-CON-LAUNDRY-001', 1

    UNION ALL
    SELECT 'demo_binh', '2026-08-24 10:00:00',
           'DEMO-FOOD-RICE-001', 1
    UNION ALL
    SELECT 'demo_binh', '2026-08-24 10:00:00',
           'DEMO-COS-SKIN-001', 1

    UNION ALL
    SELECT 'demo_binh', '2026-09-03 10:00:00',
           'DEMO-FOOD-RICE-001', 2
    UNION ALL
    SELECT 'demo_binh', '2026-09-03 10:00:00',
           'DEMO-COS-HAIR-001', 1

    UNION ALL
    SELECT 'demo_binh', '2026-09-10 10:00:00',
           'DEMO-CON-PAPER-001', 4
    UNION ALL
    SELECT 'demo_binh', '2026-09-10 10:00:00',
           'DEMO-CON-LAUNDRY-001', 1
) x
JOIN users u
    ON u.username = x.username
JOIN orders o
    ON o.user_id = u.id
   AND o.created_at = x.created_at
JOIN products p
    ON p.sku = x.sku;


-- =========================================================
-- 8. CALCULATE ORDER TOTALS FROM ORDER ITEMS
-- =========================================================

UPDATE orders o
JOIN
(
    SELECT
        order_id,
        SUM(subtotal) AS total
    FROM order_items
    GROUP BY order_id
) t
ON t.order_id = o.id
SET o.total_amount = t.total;


-- =========================================================
-- 9. PURCHASE HISTORY
--    Derived from delivered orders
-- =========================================================

INSERT INTO purchase_history
    (user_id, product_id, order_id, quantity, purchase_date, amount)

SELECT
    o.user_id,
    oi.product_id,
    o.id,
    oi.quantity,
    o.created_at,
    oi.subtotal
FROM orders o
JOIN order_items oi
    ON oi.order_id = o.id
WHERE o.status = 'DELIVERED';
-- =========================================================
-- ADD MORE PURCHASE HISTORY FOR AI TRAINING
-- =========================================================

INSERT INTO purchase_history
    (user_id, product_id, order_id, quantity, purchase_date, amount)
VALUES

-- COSMETIC - Facial Cleanser (product 7)
(1, 7, NULL, 1, '2026-06-01 10:00:00', 189000),
(1, 7, NULL, 1, '2026-07-01 10:00:00', 189000),
(1, 7, NULL, 1, '2026-08-01 10:00:00', 189000),
(1, 7, NULL, 1, '2026-09-01 10:00:00', 189000),

-- COSMETIC - Shampoo (product 8)
(2, 8, NULL, 1, '2026-06-05 10:00:00', 159000),
(2, 8, NULL, 1, '2026-07-05 10:00:00', 159000),
(2, 8, NULL, 1, '2026-08-05 10:00:00', 159000),
(2, 8, NULL, 1, '2026-09-05 10:00:00', 159000),

-- CONSUMER - Laundry Detergent (product 11)
(1, 11, NULL, 2, '2026-06-10 10:00:00', 198000),
(1, 11, NULL, 2, '2026-07-10 10:00:00', 198000),
(1, 11, NULL, 2, '2026-08-10 10:00:00', 198000),
(1, 11, NULL, 2, '2026-09-10 10:00:00', 198000),

-- CONSUMER - Toilet Paper (product 13)
(2, 13, NULL, 2, '2026-06-15 10:00:00', 90000),
(2, 13, NULL, 2, '2026-07-15 10:00:00', 90000),
(2, 13, NULL, 2, '2026-08-15 10:00:00', 90000),
(2, 13, NULL, 2, '2026-09-15 10:00:00', 90000);


-- =========================================================
-- END OF DEMO DATA
-- =========================================================
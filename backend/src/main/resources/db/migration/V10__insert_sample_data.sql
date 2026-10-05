-- Sample data for inspecting the grocery tables locally.
-- Demo accounts use a non-login password marker and must not be used in production.

INSERT INTO category (name, description)
VALUES
    ('Thực phẩm khô', 'Các loại thực phẩm khô dùng hằng ngày'),
    ('Đồ uống', 'Nước uống và các loại đồ uống'),
    ('Rau củ quả', 'Rau, củ và trái cây tươi');

INSERT INTO product
    (category_id, name, description, price, stock, unit, image_url, status)
SELECT c.id, 'Gạo ST25', 'Gạo thơm chất lượng cao', 250000.00, 50, 'kg',
       'https://example.com/images/gao-st25.jpg', 'ACTIVE'
FROM category c
WHERE c.name = 'Thực phẩm khô'
UNION ALL
SELECT c.id, 'Mì ăn liền', 'Mì ăn liền vị tôm chua cay', 4500.00, 200, 'gói',
       'https://example.com/images/mi-an-lien.jpg', 'ACTIVE'
FROM category c
WHERE c.name = 'Thực phẩm khô'
UNION ALL
SELECT c.id, 'Sữa tươi', 'Sữa tươi tiệt trùng', 35000.00, 100, 'lốc',
       'https://example.com/images/sua-tuoi.jpg', 'ACTIVE'
FROM category c
WHERE c.name = 'Đồ uống'
UNION ALL
SELECT c.id, 'Nước suối', 'Nước uống tinh khiết đóng chai', 6000.00, 300, 'chai',
       'https://example.com/images/nuoc-suoi.jpg', 'ACTIVE'
FROM category c
WHERE c.name = 'Đồ uống'
UNION ALL
SELECT c.id, 'Táo Fuji', 'Táo Fuji giòn ngọt', 80000.00, 40, 'kg',
       'https://example.com/images/tao-fuji.jpg', 'ACTIVE'
FROM category c
WHERE c.name = 'Rau củ quả'
UNION ALL
SELECT c.id, 'Cà rốt', 'Cà rốt tươi', 25000.00, 80, 'kg',
       'https://example.com/images/ca-rot.jpg', 'ACTIVE'
FROM category c
WHERE c.name = 'Rau củ quả';

INSERT INTO users (username, password, email, full_name, phone, role)
VALUES
    ('demo_an', '!DEMO_ACCOUNT_DISABLED!', 'demo-an@example.invalid',
     'Khách hàng mẫu An', '0900000001', 'CUSTOMER'),
    ('demo_binh', '!DEMO_ACCOUNT_DISABLED!', 'demo-binh@example.invalid',
     'Khách hàng mẫu Bình', '0900000002', 'CUSTOMER'),
    ('demo_admin', '!DEMO_ACCOUNT_DISABLED!', 'demo-admin@example.invalid',
     'Quản trị mẫu', '0900000003', 'ADMIN');

INSERT INTO cart (user_id)
SELECT id FROM users WHERE username IN ('demo_an', 'demo_binh');

INSERT INTO cart_items (cart_id, product_id, quantity, unit_price, subtotal)
SELECT c.id, p.id, 2, p.price, p.price * 2
FROM cart c
JOIN users u ON u.id = c.user_id
JOIN product p ON p.name = 'Gạo ST25'
WHERE u.username = 'demo_an'
UNION ALL
SELECT c.id, p.id, 3, p.price, p.price * 3
FROM cart c
JOIN users u ON u.id = c.user_id
JOIN product p ON p.name = 'Sữa tươi'
WHERE u.username = 'demo_an'
UNION ALL
SELECT c.id, p.id, 5, p.price, p.price * 5
FROM cart c
JOIN users u ON u.id = c.user_id
JOIN product p ON p.name = 'Mì ăn liền'
WHERE u.username = 'demo_binh';

INSERT INTO orders (user_id, total_amount, status)
SELECT u.id, 355000.00, 'DELIVERED'
FROM users u
WHERE u.username = 'demo_an'
UNION ALL
SELECT u.id, 250000.00, 'PAID'
FROM users u
WHERE u.username = 'demo_binh';

INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
SELECT o.id, p.id, 1, p.price, p.price
FROM orders o
JOIN users u ON u.id = o.user_id
JOIN product p ON p.name = 'Gạo ST25'
WHERE u.username = 'demo_an'
UNION ALL
SELECT o.id, p.id, 3, p.price, p.price * 3
FROM orders o
JOIN users u ON u.id = o.user_id
JOIN product p ON p.name = 'Sữa tươi'
WHERE u.username = 'demo_an'
UNION ALL
SELECT o.id, p.id, 1, p.price, p.price
FROM orders o
JOIN users u ON u.id = o.user_id
JOIN product p ON p.name = 'Gạo ST25'
WHERE u.username = 'demo_binh';

INSERT INTO purchase_history
    (user_id, product_id, order_id, quantity, purchase_date, amount)
SELECT u.id, p.id, o.id, 1, DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 7 DAY), p.price
FROM users u
JOIN orders o ON o.user_id = u.id
JOIN product p ON p.name = 'Gạo ST25'
WHERE u.username = 'demo_an'
UNION ALL
SELECT u.id, p.id, o.id, 3, DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 7 DAY), p.price * 3
FROM users u
JOIN orders o ON o.user_id = u.id
JOIN product p ON p.name = 'Sữa tươi'
WHERE u.username = 'demo_an'
UNION ALL
SELECT u.id, p.id, o.id, 1, DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 2 DAY), p.price
FROM users u
JOIN orders o ON o.user_id = u.id
JOIN product p ON p.name = 'Gạo ST25'
WHERE u.username = 'demo_binh';

INSERT INTO subscriptions
    (user_id, product_id, quantity, interval_days, next_purchase_date, status)
SELECT u.id, p.id, 1, 30, DATE_ADD(CURRENT_DATE, INTERVAL 23 DAY), 'ACTIVE'
FROM users u
JOIN product p ON p.name = 'Gạo ST25'
WHERE u.username = 'demo_an'
UNION ALL
SELECT u.id, p.id, 2, 14, DATE_ADD(CURRENT_DATE, INTERVAL 7 DAY), 'ACTIVE'
FROM users u
JOIN product p ON p.name = 'Sữa tươi'
WHERE u.username = 'demo_binh';

INSERT INTO loyalty_accounts (user_id, tier, points, total_spend)
SELECT u.id, 'SILVER', 790, 355000.00
FROM users u
WHERE u.username = 'demo_an'
UNION ALL
SELECT u.id, 'MEMBER', 250, 250000.00
FROM users u
WHERE u.username = 'demo_binh';

INSERT INTO loyalty_transactions (user_id, order_id, points, type, description)
SELECT u.id, o.id, 790, 'EARN', 'Điểm mẫu từ đơn hàng đã giao'
FROM users u
JOIN orders o ON o.user_id = u.id
WHERE u.username = 'demo_an'
UNION ALL
SELECT u.id, o.id, 250, 'EARN', 'Điểm mẫu từ đơn hàng đã thanh toán'
FROM users u
JOIN orders o ON o.user_id = u.id
WHERE u.username = 'demo_binh';

INSERT INTO ai_predictions
    (user_id, product_id, predicted_next_date, confidence, type)
SELECT u.id, p.id, DATE_ADD(CURRENT_DATE, INTERVAL 10 DAY), 92.50, 'REPLENISHMENT'
FROM users u
JOIN product p ON p.name = 'Gạo ST25'
WHERE u.username = 'demo_an'
UNION ALL
SELECT u.id, p.id, NULL, 81.20, 'RECOMMENDATION'
FROM users u
JOIN product p ON p.name = 'Táo Fuji'
WHERE u.username = 'demo_binh';

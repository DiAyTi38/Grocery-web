-- V5__seed_catalog.sql
-- Sample grocery catalog for local/demo testing

INSERT INTO categories (id, name, description) VALUES
(1, 'Rau củ quả', 'Rau, củ, quả tươi'),
(2, 'Thịt - hải sản', 'Thịt heo, gà, hải sản'),
(3, 'Sữa & trứng', 'Sữa tươi, sữa chua, trứng'),
(4, 'Đồ khô', 'Gạo, mì, gia vị');

INSERT INTO products (id, category_id, sku, name, description, unit, price, image_url, active) VALUES
(1, 1, 'VEG-001', 'Rau cải ngọt', 'Rau cải ngọt tươi trong ngày', 'bó', 12000.00, NULL, TRUE),
(2, 1, 'VEG-002', 'Cà chua', 'Cà chua bi Đà Lạt', 'kg', 28000.00, NULL, TRUE),
(3, 2, 'MEA-001', 'Thịt heo ba chỉ', 'Ba chỉ heo tươi', 'kg', 129000.00, NULL, TRUE),
(4, 3, 'DAI-001', 'Sữa tươi Vinamilk', 'Sữa tươi tiệt trùng 1L', 'hộp', 32000.00, NULL, TRUE),
(5, 4, 'DRY-001', 'Gạo ST25', 'Gạo thơm ST25 túi 5kg', 'túi', 175000.00, NULL, TRUE);

INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES
(1, 40, 0, 8),
(2, 25, 0, 5),
(3, 15, 0, 5),
(4, 60, 0, 10),
(5, 20, 0, 4);

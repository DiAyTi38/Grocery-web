-- V9__add_beauty_category_and_expand_catalog.sql
-- 1. Create Category "Sắc đẹp" (id = 5)
-- 2. Expand Category "Đồ khô" (id = 4) with 8 additional products
-- 3. Populate Category "Sắc đẹp" with 8 beauty & personal care products
-- 4. Initialize inventory for all new products

-- ====================================================================
-- 1. CATEGORY: Sắc đẹp
-- ====================================================================
INSERT INTO categories (id, name, description) VALUES
(5, 'Sắc đẹp', 'Mỹ phẩm, chăm sóc cá nhân & làm đẹp');

-- ====================================================================
-- 2. PRODUCTS FOR CATEGORY 4: Đồ khô (IDs 6 -> 13)
-- ====================================================================
INSERT INTO products (id, category_id, sku, name, description, unit, price, image_url, active) VALUES
(6, 4, 'DRY-002', 'Mì Hảo Hảo tôm chua cay', 'Thùng 30 gói mì tôm chua cay quốc dân Hảo Hảo', 'thùng', 118000.00, NULL, TRUE),
(7, 4, 'DRY-003', 'Miến dong Tây Bắc', 'Miến dong nguyên chất Tây Bắc dai giòn', 'gói', 45000.00, NULL, TRUE),
(8, 4, 'DRY-004', 'Dầu ăn Simply đậu nành 1L', 'Dầu đậu nành nguyên chất Simply tốt cho tim mạch chai 1 lít', 'chai', 58000.00, NULL, TRUE),
(9, 4, 'DRY-005', 'Nước mắm Nam Ngư Đệ Nhị 900ml', 'Nước mắm Nam Ngư đượm vị truyền thống chai 900ml', 'chai', 29000.00, NULL, TRUE),
(10, 4, 'DRY-006', 'Hạt nêm Knorr thịt thăn 400g', 'Hạt nêm từ thịt thăn xương ống & tủy Knorr gói 400g', 'gói', 34000.00, NULL, TRUE),
(11, 4, 'DRY-007', 'Đường tinh luyện Biên Hòa 1kg', 'Đường mía tinh luyện cao cấp Biên Hòa túi 1kg', 'túi', 28000.00, NULL, TRUE),
(12, 4, 'DRY-008', 'Muối i-ốt Bạc Liêu 1kg', 'Muối ăn bổ sung vi chất I-ốt Bạc Liêu gói 1kg', 'gói', 10000.00, NULL, TRUE),
(13, 4, 'DRY-009', 'Nấm hương khô rừng 200g', 'Nấm hương rừng khô tự nhiên thơm đậm đà túi 200g', 'gói', 65000.00, NULL, TRUE);

-- ====================================================================
-- 3. PRODUCTS FOR CATEGORY 5: Sắc đẹp (IDs 14 -> 21)
-- ====================================================================
INSERT INTO products (id, category_id, sku, name, description, unit, price, image_url, active) VALUES
(14, 5, 'BEA-001', 'Kem chống nắng Anessa Perfect UV Milk 60ml', 'Sữa chống nắng kiềm dầu bảo vệ tối ưu SPF50+ PA++++', 'tuýp', 395000.00, NULL, TRUE),
(15, 5, 'BEA-002', 'Sữa rửa mặt Cetaphil Gentle Cleanser 500ml', 'Sữa rửa mặt dịu lành cho mọi loại da kể cả da nhạy cảm chai 500ml', 'chai', 285000.00, NULL, TRUE),
(16, 5, 'BEA-003', 'Nước tẩy trang Bioderma Sensibio H2O 500ml', 'Nước tẩy trang làm sạch sâu dịu nhẹ nắp hồng 500ml', 'chai', 380000.00, NULL, TRUE),
(17, 5, 'BEA-004', 'Son dưỡng môi DHC Lip Cream 1.5g', 'Son dưỡng ẩm giảm thâm môi chiết xuất dầu olive tự nhiên', 'thỏi', 145000.00, NULL, TRUE),
(18, 5, 'BEA-005', 'Dầu gội phục hồi Pantene Pro-V 650ml', 'Dầu gội chăm sóc tóc hư tổn suôn mượt óng ả 650ml', 'chai', 135000.00, NULL, TRUE),
(19, 5, 'BEA-006', 'Sữa tắm dưỡng ẩm sâu Dove Deep Moisture 500g', 'Sữa tắm dưỡng thể mềm mịn da hương thơm nhẹ nhàng 500g', 'chai', 125000.00, NULL, TRUE),
(20, 5, 'BEA-007', 'Bông tẩy trang Silcot Unicharm Hộp 82 miếng', 'Bông tẩy trang Nhật Bản mềm mịn không xơ bông hộp 82 miếng', 'hộp', 42000.00, NULL, TRUE),
(21, 5, 'BEA-008', 'Kem dưỡng ẩm Neutrogena Hydro Boost 50g', 'Kem cấp nước dạng gel dưỡng ẩm suốt 72 giờ hũ 50g', 'hũ', 310000.00, NULL, TRUE);

-- ====================================================================
-- 4. INVENTORY INITIALIZATION FOR NEW PRODUCTS (IDs 6 -> 21)
-- ====================================================================
INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES
(6, 30, 0, 5),
(7, 40, 0, 8),
(8, 25, 0, 5),
(9, 50, 0, 10),
(10, 45, 0, 10),
(11, 50, 0, 10),
(12, 100, 0, 20),
(13, 20, 0, 5),
(14, 25, 0, 5),
(15, 30, 0, 5),
(16, 20, 0, 4),
(17, 40, 0, 8),
(18, 35, 0, 6),
(19, 35, 0, 6),
(20, 60, 0, 10),
(21, 20, 0, 4);

-- V2__add_profile_fields.sql
-- Thêm các trường dữ liệu phục vụ giao hàng vào bảng users

ALTER TABLE users 
ADD COLUMN phone VARCHAR(20),
ADD COLUMN address VARCHAR(255);

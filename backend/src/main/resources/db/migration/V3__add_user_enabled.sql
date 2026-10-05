-- V3__add_user_enabled.sql
-- Trạng thái hoạt động của tài khoản (vô hiệu hóa mềm thay vì xóa cứng)

ALTER TABLE users
ADD COLUMN enabled BOOLEAN NOT NULL DEFAULT TRUE;

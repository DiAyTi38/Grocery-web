-- V14__add_avatar_gender_birthdate_to_users.sql
-- Bổ sung các trường avatar_url (MEDIUMTEXT hỗ trợ cả Base64 Data URL và link ảnh), gender và birth_date vào bảng users

ALTER TABLE users
ADD COLUMN avatar_url MEDIUMTEXT NULL,
ADD COLUMN gender VARCHAR(20) NULL,
ADD COLUMN birth_date VARCHAR(20) NULL;

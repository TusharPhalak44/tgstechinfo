-- Migration: Add password reset token columns to users table
-- Run on both local and production MySQL
-- Note: IF NOT EXISTS is not supported in MySQL 8.0 for ADD COLUMN
-- Run each statement separately; ignore "Duplicate column" errors if columns already exist

ALTER TABLE users ADD COLUMN reset_token VARCHAR(255) DEFAULT NULL;
ALTER TABLE users ADD COLUMN reset_token_expires DATETIME DEFAULT NULL;

CREATE INDEX idx_users_reset_token ON users (reset_token);

-- Migration: Add country column to users table
-- Run on both local and production MySQL
-- Note: IF NOT EXISTS is not supported in MySQL 8.0 for ADD COLUMN
-- Run each statement separately; ignore "Duplicate column" errors if column already exists

ALTER TABLE users ADD COLUMN country VARCHAR(100) DEFAULT NULL AFTER company_name;

-- Add comment for documentation
ALTER TABLE users 
MODIFY COLUMN country VARCHAR(100) DEFAULT NULL COMMENT 'User country for geographic analytics';

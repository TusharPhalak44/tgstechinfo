-- Migration: Add job_title and company_name columns to users table
-- Run on both local and production MySQL
-- Note: IF NOT EXISTS is not supported in MySQL 8.0 for ADD COLUMN
-- Run each statement separately; ignore "Duplicate column" errors if columns already exist

ALTER TABLE users ADD COLUMN job_title VARCHAR(150) DEFAULT NULL AFTER email;
ALTER TABLE users ADD COLUMN company_name VARCHAR(200) DEFAULT NULL AFTER job_title;

-- Add comment for documentation
ALTER TABLE users 
MODIFY COLUMN job_title VARCHAR(150) DEFAULT NULL COMMENT 'User job title for professional information';

ALTER TABLE users 
MODIFY COLUMN company_name VARCHAR(200) DEFAULT NULL COMMENT 'User company name for professional information';

-- Add avatar column to users table
ALTER TABLE users 
ADD COLUMN avatar VARCHAR(500) DEFAULT NULL 
AFTER email;

-- Add comment for documentation
ALTER TABLE users 
MODIFY COLUMN avatar VARCHAR(500) DEFAULT NULL COMMENT 'Path to user avatar image';

-- Add account lockout columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS failed_login_attempts INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_failed_login TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP NULL;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_locked_until ON users(locked_until);

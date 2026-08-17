-- Add NOT NULL constraint to status column in contents table
-- This prevents empty/null status values from being inserted

ALTER TABLE contents 
MODIFY COLUMN status ENUM('draft','pending','review','changes_requested','approved','published','rejected') NOT NULL DEFAULT 'draft';

-- Update any existing NULL values to 'draft' before adding constraint
UPDATE contents 
SET status = 'draft' 
WHERE status IS NULL OR status = '';

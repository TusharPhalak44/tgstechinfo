-- Fix empty status values in contents table
-- This script updates any rows with empty string or NULL status to 'draft'

UPDATE contents 
SET status = 'draft' 
WHERE status = '' OR status IS NULL;

-- Verify the fix
SELECT id, title, status 
FROM contents 
WHERE status = '' OR status IS NULL;

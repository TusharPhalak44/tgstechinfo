-- ============================================
-- Transfer Content from Deleted User to New User
-- ============================================

-- Step 1: Find new user ID by email
SELECT id, first_name, last_name, email 
FROM users 
WHERE email = 'your_email@example.com';  -- Replace with actual email

-- Step 2: Find content associated with the deleted user's email pattern
-- (This helps identify which content belonged to the deleted user)
SELECT c.id, c.title, c.user_id, c.created_at, c.status
FROM contents c
WHERE c.user_id IS NOT NULL
-- If you know approximate time range, add:
-- AND c.created_at BETWEEN '2025-01-01' AND '2025-12-31'
ORDER BY c.created_at DESC;

-- Step 3: Update content user_id to new user
-- (Run this after identifying the correct new user ID and content IDs)
UPDATE contents 
SET user_id = NEW_USER_ID  -- Replace with actual new user ID
WHERE id IN (content_id_1, content_id_2, content_id_3);  -- Replace with actual content IDs

-- Step 4: Update content_edit_requests if any
-- Update requested_by (admin who requested edit)
UPDATE content_edit_requests 
SET requested_by = NEW_USER_ID
WHERE requested_by = OLD_DELETED_USER_ID;  -- If you know the old user ID

-- Update requested_to (content creator)
UPDATE content_edit_requests 
SET requested_to = NEW_USER_ID
WHERE requested_to = OLD_DELETED_USER_ID;  -- If you know the old user ID

-- Step 5: Verify the transfer
SELECT 
    u.id as user_id,
    u.first_name,
    u.last_name,
    u.email,
    c.id as content_id,
    c.title,
    c.status,
    c.created_at
FROM users u
INNER JOIN contents c ON u.id = c.user_id
WHERE u.email = 'your_email@example.com'  -- Replace with actual email
ORDER BY c.created_at DESC;

-- ============================================
-- ALTERNATIVE: If you don't know the exact content IDs
-- ============================================

-- Option A: Update all content where user_id matches a specific ID
-- (Use this if you know the deleted user's ID)
UPDATE contents 
SET user_id = NEW_USER_ID
WHERE user_id = OLD_DELETED_USER_ID;

-- Option B: Update content based on time range and email pattern
-- (Use this if you don't know the old user ID but know the time range)
UPDATE contents c
INNER JOIN users u ON c.user_id = u.id
SET c.user_id = NEW_USER_ID
WHERE u.email = 'deleted_user_email@example.com'  -- This won't work if user is deleted
-- Alternative: Update based on content creation time
UPDATE contents 
SET user_id = NEW_USER_ID
WHERE created_at BETWEEN '2025-XX-XX' AND '2025-XX-XX'  -- Replace with date range
AND user_id NOT IN (SELECT id FROM users WHERE email = 'your_email@example.com');

-- ============================================
-- COMPLETE SOLUTION (Safe Approach)
-- ============================================

-- 1. First, backup the current state
CREATE TABLE IF NOT EXISTS contents_backup AS SELECT * FROM contents;

-- 2. Find new user ID
SELECT id FROM users WHERE email = 'your_email@example.com' LIMIT 1;

-- 3. Find content that needs to be transferred
-- (Look for content with user_ids that don't exist in users table)
SELECT c.id, c.title, c.user_id, c.created_at
FROM contents c
LEFT JOIN users u ON c.user_id = u.id
WHERE u.id IS NULL;  -- This shows content with orphaned user_ids

-- 4. Update orphaned content to new user
UPDATE contents c
LEFT JOIN users u ON c.user_id = u.id
SET c.user_id = NEW_USER_ID  -- Replace with actual new user ID
WHERE u.id IS NULL;  -- Only update orphaned content

-- 5. Verify the result
SELECT c.id, c.title, c.user_id, u.email, u.first_name, u.last_name
FROM contents c
LEFT JOIN users u ON c.user_id = u.id
WHERE c.user_id = NEW_USER_ID;  -- Replace with actual new user ID

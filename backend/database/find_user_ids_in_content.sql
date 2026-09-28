-- ============================================
-- SQL Queries to Find User IDs in Content Tables
-- ============================================

-- 1. Find all unique user IDs from contents table
SELECT DISTINCT user_id 
FROM contents 
WHERE user_id IS NOT NULL 
ORDER BY user_id;

-- 2. Get user details along with their content count
SELECT 
    u.id,
    u.first_name,
    u.last_name,
    u.email,
    u.company_name,
    u.country,
    COUNT(c.id) as content_count
FROM users u
INNER JOIN contents c ON u.id = c.user_id
GROUP BY u.id, u.first_name, u.last_name, u.email, u.company_name, u.country
ORDER BY content_count DESC;

-- 3. Find users with content along with content details
SELECT 
    u.id as user_id,
    u.first_name,
    u.last_name,
    u.email,
    u.company_name,
    u.country,
    c.id as content_id,
    c.title,
    c.status,
    c.created_at as content_created_at
FROM users u
INNER JOIN contents c ON u.id = c.user_id
ORDER BY u.id, c.created_at DESC;

-- 4. Check content_edit_requests table for user references
-- Find users who have requested edits
SELECT DISTINCT requested_by as user_id
FROM content_edit_requests
WHERE requested_by IS NOT NULL;

-- Get details of users who requested edits
SELECT 
    u.id,
    u.first_name,
    u.last_name,
    u.email,
    COUNT(cer.id) as edit_requests_count
FROM users u
INNER JOIN content_edit_requests cer ON u.id = cer.requested_by
GROUP BY u.id, u.first_name, u.last_name, u.email
ORDER BY edit_requests_count DESC;

-- Find users who have been requested to make edits
SELECT DISTINCT requested_to as user_id
FROM content_edit_requests
WHERE requested_to IS NOT NULL;

-- Get details of users who were requested to make edits
SELECT 
    u.id,
    u.first_name,
    u.last_name,
    u.email,
    COUNT(cer.id) as edit_requests_received_count
FROM users u
INNER JOIN content_edit_requests cer ON u.id = cer.requested_to
GROUP BY u.id, u.first_name, u.last_name, u.email
ORDER BY edit_requests_received_count DESC;

-- 5. Find all user IDs from all content-related tables combined
SELECT DISTINCT user_id 
FROM contents 
WHERE user_id IS NOT NULL
UNION
SELECT DISTINCT requested_by as user_id 
FROM content_edit_requests 
WHERE requested_by IS NOT NULL
UNION
SELECT DISTINCT requested_to as user_id 
FROM content_edit_requests 
WHERE requested_to IS NOT NULL
ORDER BY user_id;

-- 6. Complete overview: Users with their content and edit request activity
SELECT 
    u.id,
    u.first_name,
    u.last_name,
    u.email,
    u.company_name,
    u.country,
    COUNT(DISTINCT c.id) as total_content,
    COUNT(DISTINCT cer1.id) as edit_requests_made,
    COUNT(DISTINCT cer2.id) as edit_requests_received
FROM users u
LEFT JOIN contents c ON u.id = c.user_id
LEFT JOIN content_edit_requests cer1 ON u.id = cer1.requested_by
LEFT JOIN content_edit_requests cer2 ON u.id = cer2.requested_to
GROUP BY u.id, u.first_name, u.last_name, u.email, u.company_name, u.country
HAVING total_content > 0 OR edit_requests_made > 0 OR edit_requests_received > 0
ORDER BY total_content DESC, edit_requests_made DESC, edit_requests_received DESC;

-- 7. Find users without any content (for comparison)
SELECT 
    u.id,
    u.first_name,
    u.last_name,
    u.email,
    u.company_name,
    u.country
FROM users u
LEFT JOIN contents c ON u.id = c.user_id
WHERE c.id IS NULL
ORDER BY u.id;

-- ============================================================================
-- CONTENT VISIBILITY TOGGLE FEATURE - DATABASE MIGRATION
-- ============================================================================
-- This SQL adds the ability to hide/show content on the website while
-- maintaining direct URL access.
-- 
-- Run this SQL on your production/server database to enable the feature.
-- ============================================================================

-- Add is_visible_on_site column to contents table
ALTER TABLE contents 
ADD COLUMN IF NOT EXISTS is_visible_on_site BOOLEAN DEFAULT TRUE 
COMMENT 'Controls visibility in public listings. Direct URL access still works regardless of this setting';

-- Set all existing content to visible by default (this ensures no breaking changes)
UPDATE contents 
SET is_visible_on_site = TRUE 
WHERE is_visible_on_site IS NULL;

-- ============================================================================
-- VERIFICATION QUERIES (Optional - run these to verify the changes)
-- ============================================================================

-- Check if the column was added successfully
SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    COLUMN_DEFAULT, 
    IS_NULLABLE,
    COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'contents' 
  AND COLUMN_NAME = 'is_visible_on_site';

-- Check the current visibility status of all content
SELECT 
    id,
    title,
    status,
    is_visible_on_site,
    created_at
FROM contents
ORDER BY created_at DESC
LIMIT 10;

-- Count visible vs hidden content
SELECT 
    is_visible_on_site,
    COUNT(*) as count
FROM contents
GROUP BY is_visible_on_site;

-- ============================================================================
-- ROLLBACK (Only if you need to remove this feature)
-- ============================================================================
-- Uncomment and run this ONLY if you want to completely remove the feature:
-- ALTER TABLE contents DROP COLUMN is_visible_on_site;
-- ============================================================================

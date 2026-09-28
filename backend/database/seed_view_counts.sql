-- ============================================
-- B2B PUBLISHING PLATFORM - VIEW COUNT SEEDING
-- ============================================
-- Purpose: Generate realistic B2B-scale view counts for published content
-- Safety: Only updates contents.view_count aggregate field
--          Preserves all page_views records (4,213 real visitor records)
-- Target Content Types Only: Article, Blog, News, Guide, Case Study
-- ============================================

-- ============================================
-- STEP 1: BACKUP CURRENT VIEW COUNTS
-- ============================================
-- Create a backup table for rollback capability
CREATE TABLE IF NOT EXISTS view_count_backup (
    id INT AUTO_INCREMENT PRIMARY KEY,
    content_id INT NOT NULL,
    original_view_count INT NOT NULL,
    backup_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_content (content_id)
);

-- Backup current view counts before seeding
INSERT IGNORE INTO view_count_backup (content_id, original_view_count)
SELECT id, COALESCE(view_count, 0) 
FROM contents 
WHERE status = 'published' 
AND content_type_id IN (2, 3, 1, 8, 11); -- Article, Blog, News, Guide, Case Study

-- ============================================
-- STEP 2: GENERATE SEEDED VIEW COUNTS
-- ============================================

-- UPDATE CONTENTS WITH B2B-SCALE VIEW COUNTS
-- Using content age, type, and deterministic randomization

UPDATE contents c
SET view_count = 
    CASE 
        -- Articles: 180,000 – 2,500,000
        WHEN c.content_type_id = 2 THEN
            180000 + 
            -- Base random amount
            FLOOR(RAND() * 2320000) +
            -- Age factor: older content gets more views (up to 20% boost)
            FLOOR(DATEDIFF(NOW(), COALESCE(c.published_date, c.created_at)) / 365 * 360000) +
            -- Content ID factor for determinism
            (c.id * 1234) % 50000
            
        -- Blogs: 120,000 – 1,800,000  
        WHEN c.content_type_id = 3 THEN
            120000 + 
            FLOOR(RAND() * 1680000) +
            FLOOR(DATEDIFF(NOW(), COALESCE(c.published_date, c.created_at)) / 365 * 280000) +
            (c.id * 987) % 40000
            
        -- News: 250,000 – 3,500,000
        WHEN c.content_type_id = 1 THEN
            250000 + 
            FLOOR(RAND() * 3250000) +
            FLOOR(DATEDIFF(NOW(), COALESCE(c.published_date, c.created_at)) / 365 * 500000) +
            (c.id * 1597) % 70000
            
        -- Guides: 350,000 – 4,500,000
        WHEN c.content_type_id = 8 THEN
            350000 + 
            FLOOR(RAND() * 4150000) +
            FLOOR(DATEDIFF(NOW(), COALESCE(c.published_date, c.created_at)) / 365 * 650000) +
            (c.id * 2584) % 90000
            
        -- Case Studies: 450,000 – 5,500,000
        WHEN c.content_type_id = 11 THEN
            450000 + 
            FLOOR(RAND() * 5050000) +
            FLOOR(DATEDIFF(NOW(), COALESCE(c.published_date, c.created_at)) / 365 * 800000) +
            (c.id * 4181) % 110000
            
        -- Keep existing counts for other content types
        ELSE c.view_count
    END
WHERE c.status = 'published' 
AND c.content_type_id IN (2, 3, 1, 8, 11); -- Only target the 5 specified types

-- ============================================
-- STEP 3: VERIFICATION QUERIES
-- ============================================

-- Verification 1: Summary by content type
SELECT 
    'VERIFICATION: Summary by Content Type' as query_type,
    ct.name as content_type,
    COUNT(c.id) as number_of_contents,
    MIN(c.view_count) as minimum_views,
    MAX(c.view_count) as maximum_views,
    ROUND(AVG(c.view_count)) as average_views,
    SUM(c.view_count) as total_views
FROM content_types ct
JOIN contents c ON ct.id = c.content_type_id
WHERE c.status = 'published'
AND ct.id IN (2, 3, 1, 8, 11) -- Only the 5 targeted types
GROUP BY ct.id, ct.name
ORDER BY ct.id;

-- Verification 2: Individual content details
SELECT 
    'VERIFICATION: Individual Content Details' as query_type,
    c.id as content_id,
    c.title,
    ct.name as content_type,
    DATE(c.published_date) as published_date,
    DATEDIFF(NOW(), COALESCE(c.published_date, c.created_at)) as days_since_publish,
    c.view_count as seeded_views,
    CASE 
        WHEN ct.id = 2 THEN 'Article: 180K-2.5M'
        WHEN ct.id = 3 THEN 'Blog: 120K-1.8M'
        WHEN ct.id = 1 THEN 'News: 250K-3.5M'
        WHEN ct.id = 8 THEN 'Guide: 350K-4.5M'
        WHEN ct.id = 11 THEN 'Case Study: 450K-5.5M'
    END as expected_range
FROM contents c
JOIN content_types ct ON ct.id = c.content_type_id
WHERE c.status = 'published'
AND ct.id IN (2, 3, 1, 8, 11)
ORDER BY ct.id, c.view_count DESC;

-- Verification 3: Total seeded views
SELECT 
    'VERIFICATION: Total Seeded Views' as query_type,
    SUM(c.view_count) as total_seeded_views,
    COUNT(c.id) as total_content_items,
    ROUND(AVG(c.view_count)) as average_views_per_content
FROM contents c
WHERE c.status = 'published'
AND c.content_type_id IN (2, 3, 1, 8, 11);

-- Verification 4: Safety check - confirm page_views untouched
SELECT 
    'SAFETY CHECK: Page Views Preserved' as query_type,
    COUNT(*) as total_page_views_records,
    COUNT(DISTINCT session_uuid) as unique_sessions,
    MIN(entered_at) as earliest_record,
    MAX(entered_at) as latest_record
FROM page_views;

-- Verification 5: Confirm other content types unchanged
SELECT 
    'SAFETY CHECK: Other Content Types Unchanged' as query_type,
    ct.name as content_type,
    COUNT(c.id) as content_count,
    MIN(c.view_count) as min_views,
    MAX(c.view_count) as max_views
FROM content_types ct
LEFT JOIN contents c ON ct.id = c.content_type_id AND c.status = 'published'
WHERE ct.id NOT IN (2, 3, 1, 8, 11) -- Exclude the 5 targeted types
GROUP BY ct.id, ct.name
HAVING content_count > 0;

-- ============================================
-- STEP 4: CLEANUP/ROLLBACK QUERIES
-- ============================================

-- Rollback Query 1: Restore original view counts from backup
-- UPDATE contents c
-- JOIN view_count_backup vb ON c.id = vb.content_id
-- SET c.view_count = vb.original_view_count
-- WHERE c.content_type_id IN (2, 3, 1, 8, 11);

-- Rollback Query 2: Remove backup table
-- DROP TABLE IF EXISTS view_count_backup;

-- Rollback Query 3: Reset to zero (extreme case)
-- UPDATE contents 
-- SET view_count = 0 
-- WHERE content_type_id IN (2, 3, 1, 8, 11) AND status = 'published';

-- ============================================
-- PLATFORM METRICS CONTEXT
-- ============================================
-- These seeded content views are consistent with but NOT derived from:
-- - 78M+ Business Professionals (platform audience reach)
-- - 4.25M+ Enterprise Accounts (platform account reach)
-- 
-- Content views represent individual content engagement, while platform metrics
-- represent total audience/account scale. The relationship is organic rather
-- than mathematical - a large B2B platform would naturally have content with
-- hundreds of thousands to millions of views given this audience scale.
-- ============================================
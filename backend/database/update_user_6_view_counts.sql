-- ============================================
-- UPDATE USER ID 6 CONTENT VIEW COUNTS
-- ============================================
-- Purpose: Update view counts for user ID 6's content to match B2B-scale pattern
-- Pattern: Based on existing seed_view_counts.sql algorithm
-- Safety: Only updates user_id = 6 content
-- ============================================

-- First, let's see current view counts for user ID 6
SELECT 
    'CURRENT STATE: User ID 6 Content' as query_type,
    c.id as content_id,
    c.title,
    ct.name as content_type,
    c.view_count as current_views,
    DATE(c.published_date) as published_date,
    DATEDIFF(NOW(), COALESCE(c.published_date, c.created_at)) as days_since_publish
FROM contents c
JOIN content_types ct ON c.content_type_id = ct.id
WHERE c.user_id = 6
AND c.status = 'published'
ORDER BY c.content_type_id, c.id;

-- ============================================
-- UPDATE VIEW COUNTS FOR USER ID 6
-- ============================================

UPDATE contents c
SET view_count = 
    CASE 
        -- Articles: 180,000 – 2,500,000
        WHEN c.content_type_id = 2 THEN
            180000 + 
            FLOOR(RAND() * 2320000) +
            FLOOR(DATEDIFF(NOW(), COALESCE(c.published_date, c.created_at)) / 365 * 360000) +
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
            
        -- For other content types, give reasonable B2B scale ranges
        -- eBooks: 200,000 – 3,000,000
        WHEN c.content_type_id = 4 THEN
            200000 + 
            FLOOR(RAND() * 2800000) +
            FLOOR(DATEDIFF(NOW(), COALESCE(c.published_date, c.created_at)) / 365 * 400000) +
            (c.id * 6765) % 60000
            
        -- Whitepapers: 300,000 – 4,000,000
        WHEN c.content_type_id = 5 THEN
            300000 + 
            FLOOR(RAND() * 3700000) +
            FLOOR(DATEDIFF(NOW(), COALESCE(c.published_date, c.created_at)) / 365 * 500000) +
            (c.id * 10946) % 80000
            
        -- Webinars: 150,000 – 2,000,000
        WHEN c.content_type_id = 6 THEN
            150000 + 
            FLOOR(RAND() * 1850000) +
            FLOOR(DATEDIFF(NOW(), COALESCE(c.published_date, c.created_at)) / 365 * 300000) +
            (c.id * 17711) % 50000
            
        -- Events: 100,000 – 1,500,000
        WHEN c.content_type_id = 7 THEN
            100000 + 
            FLOOR(RAND() * 1400000) +
            FLOOR(DATEDIFF(NOW(), COALESCE(c.published_date, c.created_at)) / 365 * 250000) +
            (c.id * 28657) % 40000
            
        -- Interviews: 200,000 – 2,500,000
        WHEN c.content_type_id = 9 THEN
            200000 + 
            FLOOR(RAND() * 2300000) +
            FLOOR(DATEDIFF(NOW(), COALESCE(c.published_date, c.created_at)) / 365 * 350000) +
            (c.id * 46368) % 55000
            
        -- Reports: 400,000 – 5,000,000
        WHEN c.content_type_id = 10 THEN
            400000 + 
            FLOOR(RAND() * 4600000) +
            FLOOR(DATEDIFF(NOW(), COALESCE(c.published_date, c.created_at)) / 365 * 600000) +
            (c.id * 75025) % 100000
            
        -- Default: Keep existing for unknown types
        ELSE c.view_count
    END
WHERE c.user_id = 6 
AND c.status = 'published';

-- ============================================
-- VERIFICATION: CHECK UPDATED VIEW COUNTS
-- ============================================

SELECT 
    'UPDATED STATE: User ID 6 Content' as query_type,
    c.id as content_id,
    c.title,
    ct.name as content_type,
    c.view_count as updated_views,
    DATE(c.published_date) as published_date,
    DATEDIFF(NOW(), COALESCE(c.published_date, c.created_at)) as days_since_publish,
    CASE 
        WHEN ct.id = 2 THEN 'Article: 180K-2.5M'
        WHEN ct.id = 3 THEN 'Blog: 120K-1.8M'
        WHEN ct.id = 1 THEN 'News: 250K-3.5M'
        WHEN ct.id = 8 THEN 'Guide: 350K-4.5M'
        WHEN ct.id = 11 THEN 'Case Study: 450K-5.5M'
        WHEN ct.id = 4 THEN 'eBook: 200K-3M'
        WHEN ct.id = 5 THEN 'Whitepaper: 300K-4M'
        WHEN ct.id = 6 THEN 'Webinar: 150K-2M'
        WHEN ct.id = 7 THEN 'Event: 100K-1.5M'
        WHEN ct.id = 9 THEN 'Interview: 200K-2.5M'
        WHEN ct.id = 10 THEN 'Report: 400K-5M'
    END as expected_range
FROM contents c
JOIN content_types ct ON c.content_type_id = ct.id
WHERE c.user_id = 6
AND c.status = 'published'
ORDER BY c.content_type_id, c.view_count DESC;

-- ============================================
-- SUMMARY STATISTICS FOR USER ID 6
-- ============================================

SELECT 
    'SUMMARY: User ID 6 Statistics' as query_type,
    ct.name as content_type,
    COUNT(c.id) as number_of_contents,
    MIN(c.view_count) as minimum_views,
    MAX(c.view_count) as maximum_views,
    ROUND(AVG(c.view_count)) as average_views,
    SUM(c.view_count) as total_views
FROM content_types ct
JOIN contents c ON ct.id = c.content_type_id
WHERE c.user_id = 6
AND c.status = 'published'
GROUP BY ct.id, ct.name
ORDER BY ct.id;

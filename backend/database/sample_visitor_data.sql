-- Sample Visitor Data for Analytics Testing
-- This script creates sample visitor sessions and page views for the last 30 days

-- First, get a valid consent UUID (you may need to adjust this)
SET @consent_uuid = (SELECT uuid FROM cookie_consents LIMIT 1);

-- If no consent exists, create a sample one
INSERT INTO cookie_consents (uuid, consent_type, necessary_cookies, functional_cookies, analytics_cookies, marketing_cookies, ip_address)
SELECT 
    CONCAT('consent-', UUID()),
    'accept_all',
    TRUE,
    TRUE,
    TRUE,
    TRUE,
    '127.0.0.1'
WHERE NOT EXISTS (SELECT 1 FROM cookie_consents LIMIT 1);

SET @consent_uuid = (SELECT uuid FROM cookie_consents LIMIT 1);

-- Insert sample visitor sessions for the last 30 days
INSERT INTO visitor_sessions (session_uuid, consent_uuid, session_start, session_end, total_session_duration, total_pages_visited, country, browser, operating_system, device_type, screen_resolution, language, timezone, ip_address, referrer, landing_page)
SELECT 
    CONCAT('session-', UUID()),
    @consent_uuid,
    DATE_SUB(CURRENT_DATE, INTERVAL FLOOR(RAND() * 30) DAY) + INTERVAL FLOOR(RAND() * 86400) SECOND,
    DATE_SUB(CURRENT_DATE, INTERVAL FLOOR(RAND() * 30) DAY) + INTERVAL FLOOR(RAND() * 86400) SECOND + INTERVAL FLOOR(RAND() * 1800) SECOND,
    FLOOR(RAND() * 1800) + 60, -- session duration between 60-1800 seconds
    FLOOR(RAND() * 10) + 1, -- pages visited between 1-10
    CASE FLOOR(RAND() * 5)
        WHEN 0 THEN 'United States'
        WHEN 1 THEN 'India'
        WHEN 2 THEN 'United Kingdom'
        WHEN 3 THEN 'Germany'
        ELSE 'Canada'
    END,
    CASE FLOOR(RAND() * 4)
        WHEN 0 THEN 'Chrome'
        WHEN 1 THEN 'Firefox'
        WHEN 2 THEN 'Safari'
        ELSE 'Edge'
    END,
    CASE FLOOR(RAND() * 4)
        WHEN 0 THEN 'Windows'
        WHEN 1 THEN 'macOS'
        WHEN 2 THEN 'Linux'
        ELSE 'Android'
    END,
    CASE FLOOR(RAND() * 3)
        WHEN 0 THEN 'desktop'
        WHEN 1 THEN 'mobile'
        ELSE 'tablet'
    END,
    CASE FLOOR(RAND() * 5)
        WHEN 0 THEN '1920x1080'
        WHEN 1 THEN '1366x768'
        WHEN 2 THEN '1440x900'
        WHEN 3 THEN '1536x864'
        ELSE '2560x1440'
    END,
    'en-US',
    'America/New_York',
    CONCAT(FLOOR(RAND() * 255), '.', FLOOR(RAND() * 255), '.', FLOOR(RAND() * 255), '.', FLOOR(RAND() * 255)),
    CASE WHEN RAND() > 0.5 THEN 'https://google.com' ELSE NULL END,
    CASE FLOOR(RAND() * 5)
        WHEN 0 THEN '/'
        WHEN 1 THEN '/blog'
        WHEN 2 THEN '/articles'
        WHEN 3 THEN '/category/technology'
        ELSE '/contact'
    END
FROM (
    SELECT 1 AS n UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION
    SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION
    SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14 UNION SELECT 15 UNION
    SELECT 16 UNION SELECT 17 UNION SELECT 18 UNION SELECT 19 UNION SELECT 20 UNION
    SELECT 21 UNION SELECT 22 UNION SELECT 23 UNION SELECT 24 UNION SELECT 25 UNION
    SELECT 26 UNION SELECT 27 UNION SELECT 28 UNION SELECT 29 UNION SELECT 30
) AS numbers;

-- Insert sample page views for each session
INSERT INTO page_views (session_uuid, consent_uuid, page_url, page_title, page_type, entered_at, exited_at, time_spent_seconds, scroll_percentage, is_bounce)
SELECT 
    vs.session_uuid,
    vs.consent_uuid,
    CASE FLOOR(RAND() * 6)
        WHEN 0 THEN '/'
        WHEN 1 THEN '/blog/getting-started-with-react'
        WHEN 2 THEN '/articles/advanced-css-techniques'
        WHEN 3 THEN '/category/technology'
        WHEN 4 THEN '/search?q=react'
        ELSE '/contact'
    END,
    CASE FLOOR(RAND() * 6)
        WHEN 0 THEN 'Home'
        WHEN 1 THEN 'Getting Started with React'
        WHEN 2 THEN 'Advanced CSS Techniques'
        WHEN 3 THEN 'Technology'
        WHEN 4 THEN 'Search Results'
        ELSE 'Contact Us'
    END,
    CASE FLOOR(RAND() * 6)
        WHEN 0 THEN 'home'
        WHEN 1 THEN 'blog'
        WHEN 2 THEN 'article'
        WHEN 3 THEN 'category'
        WHEN 4 THEN 'search'
        ELSE 'contact'
    END,
    vs.session_start + INTERVAL FLOOR(RAND() * 300) SECOND,
    vs.session_start + INTERVAL FLOOR(RAND() * 300) SECOND + INTERVAL FLOOR(RAND() * 120) SECOND,
    FLOOR(RAND() * 120) + 10,
    ROUND(RAND() * 100, 2),
    CASE WHEN RAND() > 0.7 THEN TRUE ELSE FALSE END
FROM visitor_sessions vs
CROSS JOIN (
    SELECT 1 AS n UNION SELECT 2 UNION SELECT 3
) AS page_numbers
WHERE vs.session_start >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
LIMIT 150;

-- Verify the data
SELECT 
    DATE(session_start) as date,
    COUNT(*) as total_sessions,
    AVG(total_session_duration) as avg_duration,
    AVG(total_pages_visited) as avg_pages
FROM visitor_sessions
WHERE session_start >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
GROUP BY DATE(session_start)
ORDER BY date DESC;

-- Insert Sample CTA Data for Testing
-- This script creates sample CTA clicks for the last 30 days

-- First, let's check if we have sessions and consents to work with
SET @has_sessions = (SELECT COUNT(*) FROM visitor_sessions LIMIT 1);
SET @has_consents = (SELECT COUNT(*) FROM cookie_consents LIMIT 1);

-- If we don't have enough data, create some minimal test data first
INSERT INTO cookie_consents (uuid, analytics_cookies, marketing_cookies, functional_cookies, created_at)
SELECT 
    UUID() as uuid,
    TRUE as analytics_cookies,
    TRUE as marketing_cookies, 
    TRUE as functional_cookies,
    NOW() - INTERVAL FLOOR(RAND() * 30) DAY as created_at
FROM (SELECT 1) as dummy
WHERE @has_consents = 0
LIMIT 5;

-- Create test sessions if needed
INSERT INTO visitor_sessions (session_uuid, consent_uuid, session_start, landing_page, country, device_type, browser, operating_system)
SELECT 
    UUID() as session_uuid,
    (SELECT uuid FROM cookie_consents ORDER BY RAND() LIMIT 1) as consent_uuid,
    NOW() - INTERVAL FLOOR(RAND() * 30) DAY as session_start,
    '/' as landing_page,
    CASE FLOOR(RAND() * 5)
        WHEN 0 THEN 'USA'
        WHEN 1 THEN 'India' 
        WHEN 2 THEN 'UK'
        WHEN 3 THEN 'Germany'
        ELSE 'Other'
    END as country,
    CASE FLOOR(RAND() * 3)
        WHEN 0 THEN 'desktop'
        WHEN 1 THEN 'mobile'
        ELSE 'tablet'
    END as device_type,
    CASE FLOOR(RAND() * 4)
        WHEN 0 THEN 'Chrome'
        WHEN 1 THEN 'Firefox'
        WHEN 2 THEN 'Safari'
        ELSE 'Edge'
    END as browser,
    CASE FLOOR(RAND() * 4)
        WHEN 0 THEN 'Windows'
        WHEN 1 THEN 'macOS'
        WHEN 2 THEN 'Linux'
        ELSE 'Android'
    END as operating_system
FROM (SELECT 1) as dummy
WHERE @has_sessions = 0
LIMIT 10;

-- Now insert sample CTA clicks using existing sessions
INSERT INTO cta_clicks (session_uuid, consent_uuid, cta_type, cta_text, cta_location, clicked_at)
SELECT 
    session_uuid,
    consent_uuid,
    CASE FLOOR(RAND() * 7)
        WHEN 0 THEN 'download_whitepaper'
        WHEN 1 THEN 'request_demo'
        WHEN 2 THEN 'contact_sales'
        WHEN 3 THEN 'subscribe'
        WHEN 4 THEN 'register_webinar'
        WHEN 5 THEN 'request_quote'
        ELSE 'other'
    END as cta_type,
    CASE FLOOR(RAND() * 5)
        WHEN 0 THEN 'Download Now'
        WHEN 1 THEN 'Get Started'
        WHEN 2 THEN 'Contact Us'
        WHEN 3 THEN 'Subscribe'
        ELSE 'Learn More'
    END as cta_text,
    CASE FLOOR(RAND() * 4)
        WHEN 0 THEN 'hero_section'
        WHEN 1 THEN 'sidebar'
        WHEN 2 THEN 'footer'
        ELSE 'inline'
    END as cta_location,
    session_start + INTERVAL FLOOR(RAND() * 300) SECOND as clicked_at
FROM visitor_sessions
WHERE session_start >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
ORDER BY RAND()
LIMIT 20;

-- Insert multiple CTA clicks per session to show variety
INSERT INTO cta_clicks (session_uuid, consent_uuid, cta_type, cta_text, cta_location, clicked_at)
SELECT 
    session_uuid,
    consent_uuid,
    CASE FLOOR(RAND() * 7)
        WHEN 0 THEN 'download_whitepaper'
        WHEN 1 THEN 'request_demo'
        WHEN 2 THEN 'contact_sales'
        WHEN 3 THEN 'subscribe'
        WHEN 4 THEN 'register_webinar'
        WHEN 5 THEN 'request_quote'
        ELSE 'other'
    END as cta_type,
    CASE FLOOR(RAND() * 5)
        WHEN 0 THEN 'Download Whitepaper'
        WHEN 1 THEN 'Request Demo'
        WHEN 2 THEN 'Contact Sales'
        WHEN 3 THEN 'Subscribe Now'
        ELSE 'Get Quote'
    END as cta_text,
    CASE FLOOR(RAND() * 4)
        WHEN 0 THEN 'hero_section'
        WHEN 1 THEN 'sidebar'
        WHEN 2 THEN 'footer'
        ELSE 'inline'
    END as cta_location,
    session_start + INTERVAL FLOOR(RAND() * 600) SECOND as clicked_at
FROM visitor_sessions
WHERE session_start >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
  AND RAND() > 0.5 -- 50% of sessions get second CTA
LIMIT 15;

-- Verify the inserted data
SELECT 
    cta_type,
    COUNT(*) as click_count,
    COUNT(DISTINCT session_uuid) as unique_sessions,
    MIN(clicked_at) as first_click,
    MAX(clicked_at) as last_click
FROM cta_clicks
WHERE clicked_at >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
GROUP BY cta_type
ORDER BY click_count DESC;

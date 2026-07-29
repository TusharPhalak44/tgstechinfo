-- Sample Conversion Data for Analytics Testing
-- This script creates sample conversion data for the last 30 days

-- Get existing session UUIDs
SET @session_uuids = (SELECT GROUP_CONCAT(session_uuid) FROM visitor_sessions LIMIT 30);

-- Insert sample CTA clicks for conversion tracking
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
    END,
    CASE FLOOR(RAND() * 5)
        WHEN 0 THEN 'Download Now'
        WHEN 1 THEN 'Get Started'
        WHEN 2 THEN 'Contact Us'
        WHEN 3 THEN 'Subscribe'
        ELSE 'Learn More'
    END,
    CASE FLOOR(RAND() * 4)
        WHEN 0 THEN 'hero_section'
        WHEN 1 THEN 'sidebar'
        WHEN 2 THEN 'footer'
        ELSE 'inline'
    END,
    session_start + INTERVAL FLOOR(RAND() * 300) SECOND
FROM visitor_sessions
WHERE session_start >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
  AND RAND() > 0.7 -- Only 30% of sessions have conversions
LIMIT 15;

-- Insert sample downloads
INSERT INTO downloads (session_uuid, consent_uuid, content_id, file_name, file_type, file_size, downloaded_at)
SELECT 
    session_uuid,
    consent_uuid,
    FLOOR(RAND() * 100) + 1,
    CONCAT('whitepaper-', FLOOR(RAND() * 10) + 1, '.pdf'),
    'pdf',
    FLOOR(RAND() * 5000000) + 1000000,
    session_start + INTERVAL FLOOR(RAND() * 600) SECOND
FROM visitor_sessions
WHERE session_start >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
  AND RAND() > 0.8 -- Only 20% of sessions have downloads
LIMIT 10;

-- Insert sample newsletter signups
INSERT INTO newsletter_events (session_uuid, consent_uuid, event_type, email, event_data, created_at)
SELECT 
    session_uuid,
    consent_uuid,
    'signup',
    CONCAT('user', FLOOR(RAND() * 1000), '@example.com'),
    JSON_OBJECT('source', 'footer', 'form_type', 'inline'),
    session_start + INTERVAL FLOOR(RAND() * 180) SECOND
FROM visitor_sessions
WHERE session_start >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
  AND RAND() > 0.85 -- Only 15% of sessions have newsletter signups
LIMIT 8;

-- Verify the conversion data
SELECT 
    'CTA Clicks' as conversion_type,
    DATE(clicked_at) as date,
    COUNT(*) as count
FROM cta_clicks
WHERE clicked_at >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
GROUP BY DATE(clicked_at)

UNION ALL

SELECT 
    'Downloads' as conversion_type,
    DATE(downloaded_at) as date,
    COUNT(*) as count
FROM downloads
WHERE downloaded_at >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
GROUP BY DATE(downloaded_at)

UNION ALL

SELECT 
    'Newsletter Signups' as conversion_type,
    DATE(created_at) as date,
    COUNT(*) as count
FROM newsletter_events
WHERE created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
  AND event_type = 'signup'
GROUP BY DATE(created_at)
ORDER BY date DESC, conversion_type;

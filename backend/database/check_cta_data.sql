-- Check if CTA data exists
SELECT 
    'CTA Clicks Count' as check_type,
    COUNT(*) as count
FROM cta_clicks
UNION ALL
SELECT 
    'Visitor Sessions Count' as check_type,
    COUNT(*) as count
FROM visitor_sessions
UNION ALL
SELECT 
    'Cookie Consents Count' as check_type,
    COUNT(*) as count
FROM cookie_consents;

-- Sample CTA data if it exists
SELECT 
    cta_type,
    COUNT(*) as click_count,
    MIN(clicked_at) as first_click,
    MAX(clicked_at) as last_click
FROM cta_clicks
GROUP BY cta_type
ORDER BY click_count DESC;

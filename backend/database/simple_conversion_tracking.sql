-- Simple Conversion Tracking System
-- This creates a basic conversion tracking without complex foreign key dependencies

-- Simple conversions table
CREATE TABLE IF NOT EXISTS conversions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_uuid VARCHAR(36) NOT NULL,
    consent_uuid VARCHAR(36) NOT NULL,
    conversion_type ENUM('cta_click', 'download', 'newsletter_signup', 'form_submit', 'contact_submit') NOT NULL,
    page_url VARCHAR(500),
    conversion_value DECIMAL(10,2) DEFAULT 0,
    metadata JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_session_uuid (session_uuid),
    INDEX idx_consent_uuid (consent_uuid),
    INDEX idx_conversion_type (conversion_type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample conversion data for the last 30 days
INSERT INTO conversions (session_uuid, consent_uuid, conversion_type, page_url, conversion_value, metadata, created_at)
SELECT 
    session_uuid,
    consent_uuid,
    CASE FLOOR(RAND() * 5)
        WHEN 0 THEN 'cta_click'
        WHEN 1 THEN 'download'
        WHEN 2 THEN 'newsletter_signup'
        WHEN 3 THEN 'form_submit'
        ELSE 'contact_submit'
    END,
    landing_page,
    CASE FLOOR(RAND() * 5)
        WHEN 1 THEN 50.00
        WHEN 2 THEN 25.00
        WHEN 3 THEN 75.00
        WHEN 4 THEN 100.00
        ELSE 10.00
    END,
    JSON_OBJECT(
        'source', CASE FLOOR(RAND() * 4)
            WHEN 0 THEN 'hero'
            WHEN 1 THEN 'sidebar'
            WHEN 2 THEN 'footer'
            ELSE 'inline'
        END,
        'device', device_type
    ),
    session_start + INTERVAL FLOOR(RAND() * 600) SECOND
FROM visitor_sessions
WHERE session_start >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
  AND RAND() > 0.7 -- Only 30% of sessions have conversions
LIMIT 20;

-- Verify the conversion data
SELECT 
    DATE(created_at) as date,
    conversion_type,
    COUNT(*) as conversion_count,
    SUM(conversion_value) as total_value
FROM conversions
WHERE created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
GROUP BY DATE(created_at), conversion_type
ORDER BY date DESC, conversion_type;

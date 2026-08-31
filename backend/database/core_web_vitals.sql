-- Core Web Vitals Tracking Table
CREATE TABLE IF NOT EXISTS core_web_vitals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_uuid VARCHAR(255) NOT NULL,
    consent_uuid VARCHAR(255),
    
    -- Core Web Vitals Metrics
    lcp DECIMAL(10, 2) COMMENT 'Largest Contentful Paint (seconds)',
    fid INT COMMENT 'First Input Delay (milliseconds)',
    cls DECIMAL(10, 4) COMMENT 'Cumulative Layout Shift',
    ttfb INT COMMENT 'Time to First Byte (milliseconds)',
    fcp DECIMAL(10, 2) COMMENT 'First Contentful Paint (seconds)',
    inp INT COMMENT 'Interaction to Next Paint (milliseconds)',
    
    -- Additional Performance Metrics
    dom_content_loaded_time INT COMMENT 'DOM Content Loaded (milliseconds)',
    load_complete_time INT COMMENT 'Load Complete (milliseconds)',
    total_resources INT COMMENT 'Total number of resources loaded',
    
    -- Context
    page_url VARCHAR(500),
    page_title VARCHAR(255),
    device_type VARCHAR(50),
    browser VARCHAR(100),
    
    -- Timestamps
    measured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_session_uuid (session_uuid),
    INDEX idx_measured_at (measured_at),
    INDEX idx_page_url (page_url(255))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

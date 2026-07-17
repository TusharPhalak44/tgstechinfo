-- Visitor Behaviour Tracking System Tables
-- Built on top of existing Cookie Consent system

-- Visitor Sessions Table
CREATE TABLE IF NOT EXISTS visitor_sessions (
    session_uuid VARCHAR(36) PRIMARY KEY,
    consent_uuid VARCHAR(36) NOT NULL,
    user_id BIGINT(20) UNSIGNED NULL,
    session_start TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    session_end TIMESTAMP NULL,
    total_session_duration INT DEFAULT 0,
    total_pages_visited INT DEFAULT 0,
    country VARCHAR(100),
    browser VARCHAR(100),
    operating_system VARCHAR(100),
    device_type ENUM('desktop', 'mobile', 'tablet') NULL,
    screen_resolution VARCHAR(20),
    language VARCHAR(10),
    timezone VARCHAR(50),
    ip_address VARCHAR(45),
    referrer TEXT,
    landing_page VARCHAR(500),
    exit_page VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (consent_uuid) REFERENCES cookie_consents(uuid) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_consent_uuid (consent_uuid),
    INDEX idx_user_id (user_id),
    INDEX idx_session_start (session_start),
    INDEX idx_session_end (session_end),
    INDEX idx_country (country),
    INDEX idx_device_type (device_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Page Views Table
CREATE TABLE IF NOT EXISTS page_views (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_uuid VARCHAR(36) NOT NULL,
    consent_uuid VARCHAR(36) NOT NULL,
    page_url VARCHAR(500) NOT NULL,
    page_title VARCHAR(255),
    page_type ENUM('home', 'article', 'blog', 'category', 'search', 'contact', 'landing', 'other') DEFAULT 'other',
    content_type VARCHAR(50),
    content_id INT NULL,
    entered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    exited_at TIMESTAMP NULL,
    time_spent_seconds INT DEFAULT 0,
    scroll_percentage DECIMAL(5,2) DEFAULT 0,
    is_bounce BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_uuid) REFERENCES visitor_sessions(session_uuid) ON DELETE CASCADE,
    FOREIGN KEY (consent_uuid) REFERENCES cookie_consents(uuid) ON DELETE CASCADE,
    INDEX idx_session_uuid (session_uuid),
    INDEX idx_consent_uuid (consent_uuid),
    INDEX idx_page_url (page_url(255)),
    INDEX idx_content_id (content_id),
    INDEX idx_entered_at (entered_at),
    INDEX idx_page_type (page_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Content Engagement Table
CREATE TABLE IF NOT EXISTS content_engagement (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_uuid VARCHAR(36) NOT NULL,
    consent_uuid VARCHAR(36) NOT NULL,
    content_id INT NOT NULL,
    engagement_type ENUM('view', 'read', 'download', 'share', 'bookmark', 'print', 'copy_link') NOT NULL,
    engagement_data JSON NULL,
    reading_time_seconds INT DEFAULT 0,
    scroll_depth DECIMAL(5,2) DEFAULT 0,
    max_scroll_depth DECIMAL(5,2) DEFAULT 0,
    exit_position DECIMAL(5,2) DEFAULT 0,
    reading_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_uuid) REFERENCES visitor_sessions(session_uuid) ON DELETE CASCADE,
    FOREIGN KEY (consent_uuid) REFERENCES cookie_consents(uuid) ON DELETE CASCADE,
    FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE,
    INDEX idx_session_uuid (session_uuid),
    INDEX idx_consent_uuid (consent_uuid),
    INDEX idx_content_id (content_id),
    INDEX idx_engagement_type (engagement_type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Downloads Table
CREATE TABLE IF NOT EXISTS downloads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_uuid VARCHAR(36) NOT NULL,
    consent_uuid VARCHAR(36) NOT NULL,
    content_id INT NOT NULL,
    file_id VARCHAR(100),
    file_name VARCHAR(255),
    file_type VARCHAR(50),
    file_size BIGINT,
    downloaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_uuid) REFERENCES visitor_sessions(session_uuid) ON DELETE CASCADE,
    FOREIGN KEY (consent_uuid) REFERENCES cookie_consents(uuid) ON DELETE CASCADE,
    FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE,
    INDEX idx_session_uuid (session_uuid),
    INDEX idx_consent_uuid (consent_uuid),
    INDEX idx_content_id (content_id),
    INDEX idx_downloaded_at (downloaded_at),
    INDEX idx_file_type (file_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Search History Table
CREATE TABLE IF NOT EXISTS search_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_uuid VARCHAR(36) NOT NULL,
    consent_uuid VARCHAR(36) NOT NULL,
    search_keyword VARCHAR(255) NOT NULL,
    search_type ENUM('keyword', 'category', 'tag', 'content_type') DEFAULT 'keyword',
    results_count INT DEFAULT 0,
    selected_result_id INT NULL,
    selected_result_title VARCHAR(255),
    search_time_ms INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_uuid) REFERENCES visitor_sessions(session_uuid) ON DELETE CASCADE,
    FOREIGN KEY (consent_uuid) REFERENCES cookie_consents(uuid) ON DELETE CASCADE,
    INDEX idx_session_uuid (session_uuid),
    INDEX idx_consent_uuid (consent_uuid),
    INDEX idx_search_keyword (search_keyword),
    INDEX idx_search_type (search_type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Video Progress Table
CREATE TABLE IF NOT EXISTS video_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_uuid VARCHAR(36) NOT NULL,
    consent_uuid VARCHAR(36) NOT NULL,
    content_id INT NOT NULL,
    video_started_at TIMESTAMP NULL,
    video_25_percent_at TIMESTAMP NULL,
    video_50_percent_at TIMESTAMP NULL,
    video_75_percent_at TIMESTAMP NULL,
    video_completed_at TIMESTAMP NULL,
    duration_watched_seconds INT DEFAULT 0,
    total_duration_seconds INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (session_uuid) REFERENCES visitor_sessions(session_uuid) ON DELETE CASCADE,
    FOREIGN KEY (consent_uuid) REFERENCES cookie_consents(uuid) ON DELETE CASCADE,
    FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE,
    INDEX idx_session_uuid (session_uuid),
    INDEX idx_consent_uuid (consent_uuid),
    INDEX idx_content_id (content_id),
    INDEX idx_video_completed_at (video_completed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- CTA Clicks Table
CREATE TABLE IF NOT EXISTS cta_clicks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_uuid VARCHAR(36) NOT NULL,
    consent_uuid VARCHAR(36) NOT NULL,
    content_id INT NULL,
    cta_type ENUM('download_whitepaper', 'request_demo', 'contact_sales', 'subscribe', 'register_webinar', 'request_quote', 'other') NOT NULL,
    cta_text VARCHAR(255),
    cta_location VARCHAR(255),
    clicked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_uuid) REFERENCES visitor_sessions(session_uuid) ON DELETE CASCADE,
    FOREIGN KEY (consent_uuid) REFERENCES cookie_consents(uuid) ON DELETE CASCADE,
    FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE SET NULL,
    INDEX idx_session_uuid (session_uuid),
    INDEX idx_consent_uuid (consent_uuid),
    INDEX idx_content_id (content_id),
    INDEX idx_cta_type (cta_type),
    INDEX idx_clicked_at (clicked_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Newsletter Events Table
CREATE TABLE IF NOT EXISTS newsletter_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_uuid VARCHAR(36) NOT NULL,
    consent_uuid VARCHAR(36) NOT NULL,
    event_type ENUM('signup', 'confirmation', 'unsubscribe', 'bounce') NOT NULL,
    email VARCHAR(255),
    event_data JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_uuid) REFERENCES visitor_sessions(session_uuid) ON DELETE CASCADE,
    FOREIGN KEY (consent_uuid) REFERENCES cookie_consents(uuid) ON DELETE CASCADE,
    INDEX idx_session_uuid (session_uuid),
    INDEX idx_consent_uuid (consent_uuid),
    INDEX idx_event_type (event_type),
    INDEX idx_email (email),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User Journey Table (stores navigation sequence)
CREATE TABLE IF NOT EXISTS user_journey (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_uuid VARCHAR(36) NOT NULL,
    consent_uuid VARCHAR(36) NOT NULL,
    step_number INT NOT NULL,
    page_url VARCHAR(500) NOT NULL,
    page_title VARCHAR(255),
    content_type VARCHAR(50),
    content_id INT NULL,
    action_type ENUM('page_view', 'content_view', 'download', 'search', 'cta_click', 'form_submit', 'other') DEFAULT 'page_view',
    action_data JSON NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_uuid) REFERENCES visitor_sessions(session_uuid) ON DELETE CASCADE,
    FOREIGN KEY (consent_uuid) REFERENCES cookie_consents(uuid) ON DELETE CASCADE,
    INDEX idx_session_uuid (session_uuid),
    INDEX idx_consent_uuid (consent_uuid),
    INDEX idx_step_number (step_number),
    INDEX idx_timestamp (timestamp),
    UNIQUE KEY unique_step (session_uuid, step_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

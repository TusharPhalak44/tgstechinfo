-- Chatbot Sessions Table
CREATE TABLE IF NOT EXISTS chatbot_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    user_id INT NULL,
    visitor_session_id VARCHAR(255) NULL,
    browser_info JSON NULL,
    country VARCHAR(100) NULL,
    device_type VARCHAR(50) NULL,
    ip_address VARCHAR(45) NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    message_count INT DEFAULT 0,
    search_count INT DEFAULT 0,
    click_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_session_id (session_id),
    INDEX idx_user_id (user_id),
    INDEX idx_visitor_session_id (visitor_session_id),
    INDEX idx_started_at (started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Chatbot Messages Table
CREATE TABLE IF NOT EXISTS chatbot_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    message_type ENUM('user', 'bot') NOT NULL,
    message TEXT NOT NULL,
    metadata JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_session_id (session_id),
    INDEX idx_message_type (message_type),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (session_id) REFERENCES chatbot_sessions(session_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Chatbot Search Logs Table
CREATE TABLE IF NOT EXISTS chatbot_search_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    query VARCHAR(500) NOT NULL,
    search_type ENUM('title', 'category', 'tag', 'keyword', 'content_type') NOT NULL,
    results_count INT DEFAULT 0,
    search_metadata JSON NULL,
    ip_address VARCHAR(45) NULL,
    country VARCHAR(100) NULL,
    device_type VARCHAR(50) NULL,
    browser_info JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_session_id (session_id),
    INDEX idx_query (query(255)),
    INDEX idx_search_type (search_type),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (session_id) REFERENCES chatbot_sessions(session_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Chatbot Click Logs Table
CREATE TABLE IF NOT EXISTS chatbot_click_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    content_id INT NOT NULL,
    search_query VARCHAR(500) NULL,
    search_type ENUM('title', 'category', 'tag', 'keyword', 'content_type') NULL,
    position_in_results INT NULL,
    click_metadata JSON NULL,
    ip_address VARCHAR(45) NULL,
    country VARCHAR(100) NULL,
    device_type VARCHAR(50) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_session_id (session_id),
    INDEX idx_content_id (content_id),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (session_id) REFERENCES chatbot_sessions(session_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Chatbot Feedback Table
CREATE TABLE IF NOT EXISTS chatbot_feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    content_id INT NULL,
    search_query VARCHAR(500) NULL,
    feedback_type ENUM('helpful', 'not_helpful', 'irrelevant', 'inaccurate') NOT NULL,
    feedback_text TEXT NULL,
    rating INT NULL CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_session_id (session_id),
    INDEX idx_content_id (content_id),
    INDEX idx_feedback_type (feedback_type),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (session_id) REFERENCES chatbot_sessions(session_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Chatbot Trending Cache Table
CREATE TABLE IF NOT EXISTS chatbot_trending_cache (
    id INT AUTO_INCREMENT PRIMARY KEY,
    content_id INT NOT NULL,
    search_count INT DEFAULT 0,
    click_count INT DEFAULT 0,
    trend_score DECIMAL(10,2) DEFAULT 0.00,
    category_id INT NULL,
    content_type_id INT NULL,
    last_calculated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_content_id (content_id),
    INDEX idx_trend_score (trend_score DESC),
    INDEX idx_category_id (category_id),
    INDEX idx_content_type_id (content_type_id),
    INDEX idx_last_calculated (last_calculated)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

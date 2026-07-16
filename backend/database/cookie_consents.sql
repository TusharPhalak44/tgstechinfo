-- Create cookie_consents table
CREATE TABLE IF NOT EXISTS cookie_consents (
    uuid VARCHAR(36) PRIMARY KEY,
    user_id BIGINT(20) UNSIGNED NULL,
    session_id VARCHAR(255) NULL,
    consent_type ENUM('accept_all', 'reject_all', 'custom') NOT NULL,
    necessary_cookies BOOLEAN DEFAULT TRUE,
    functional_cookies BOOLEAN DEFAULT FALSE,
    analytics_cookies BOOLEAN DEFAULT FALSE,
    marketing_cookies BOOLEAN DEFAULT FALSE,
    consent_version INT DEFAULT 1,
    expires_at TIMESTAMP NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_session_id (session_id),
    INDEX idx_expires_at (expires_at),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create cookie_consent_logs table
CREATE TABLE IF NOT EXISTS cookie_consent_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    consent_uuid VARCHAR(36) NOT NULL,
    action ENUM('create', 'update', 'withdraw', 'expire') NOT NULL,
    previous_consent JSON NULL,
    new_consent JSON NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (consent_uuid) REFERENCES cookie_consents(uuid) ON DELETE CASCADE,
    INDEX idx_consent_uuid (consent_uuid),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

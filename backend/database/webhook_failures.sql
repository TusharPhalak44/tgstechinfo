-- Webhook failures tracking table
-- Stores failed webhook attempts for debugging and retry purposes

CREATE TABLE IF NOT EXISTS webhook_failures (
    id INT AUTO_INCREMENT PRIMARY KEY,
    content_id INT NOT NULL,
    webhook_url TEXT NOT NULL,
    payload JSON,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    retry_count INT DEFAULT 0,
    last_retry_at TIMESTAMP NULL,
    resolved BOOLEAN DEFAULT FALSE,
    
    INDEX idx_content_id (content_id),
    INDEX idx_created_at (created_at),
    INDEX idx_resolved (resolved),
    
    FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

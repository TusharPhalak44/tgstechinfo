-- ─────────────────────────────────────────────────────────────────────────────
-- Case Studies Tables
-- ─────────────────────────────────────────────────────────────────────────────

-- Add columns to contents table for case study-specific fields
ALTER TABLE contents
ADD COLUMN email_subject VARCHAR(500) NULL,
ADD COLUMN email_template LONGTEXT NULL,
ADD COLUMN case_study_headline VARCHAR(500) NULL,
ADD COLUMN case_study_summary VARCHAR(1000) NULL;

-- Store case study lead submissions (name, email, contact)
CREATE TABLE IF NOT EXISTS case_study_submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    content_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    contact VARCHAR(50) NOT NULL,
    ip_address VARCHAR(100) NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE,
    INDEX idx_content_id (content_id),
    INDEX idx_email (email),
    INDEX idx_created_at (created_at)
);

-- Seed Case Study content type
INSERT IGNORE INTO content_types (name, slug)
VALUES ('Case Study', 'case-study');

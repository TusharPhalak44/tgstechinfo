-- ─────────────────────────────────────────────────────────────────────────────
-- Add Webinar Metadata Columns and Webinar Registrations Table
-- ─────────────────────────────────────────────────────────────────────────────

-- Add webinar specific columns to contents table
ALTER TABLE contents
ADD COLUMN IF NOT EXISTS hosted_by VARCHAR(255) NULL AFTER webinar_date,
ADD COLUMN IF NOT EXISTS platform VARCHAR(255) NULL AFTER hosted_by,
ADD COLUMN IF NOT EXISTS webinar_type VARCHAR(50) NULL DEFAULT 'live' AFTER platform,
ADD COLUMN IF NOT EXISTS join_link VARCHAR(1000) NULL AFTER webinar_type;

-- Create webinar_registrations table for tracking attendee registrations
CREATE TABLE IF NOT EXISTS webinar_registrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    webinar_id INT NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    job_title VARCHAR(150) NULL,
    company_name VARCHAR(150) NULL,
    contact_number VARCHAR(50) NULL,
    registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (webinar_id) REFERENCES contents(id) ON DELETE CASCADE,
    INDEX idx_webinar_id (webinar_id),
    INDEX idx_registered_at (registered_at)
);

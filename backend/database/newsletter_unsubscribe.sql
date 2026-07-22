-- ─────────────────────────────────────────────────────────────────────────────
-- Newsletter Unsubscribe Table
-- ─────────────────────────────────────────────────────────────────────────────

-- Add unsubscribe token column to newsletter_subscribers
ALTER TABLE newsletter_subscribers
ADD COLUMN IF NOT EXISTS unsubscribe_token VARCHAR(255) NULL AFTER email,
ADD COLUMN IF NOT EXISTS unsubscribed_at TIMESTAMP NULL AFTER unsubscribe_token,
ADD COLUMN IF NOT EXISTS is_active TINYINT(1) DEFAULT 1 AFTER unsubscribed_at;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_unsubscribe_token ON newsletter_subscribers(unsubscribe_token);

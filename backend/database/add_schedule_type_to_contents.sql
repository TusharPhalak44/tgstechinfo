-- ─────────────────────────────────────────────────────────────────────────────
-- Add schedule_type column to contents table
-- Allows distinguishing between date-only scheduled publications and exact-time schedules.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE contents 
ADD COLUMN schedule_type VARCHAR(50) DEFAULT 'date_only' AFTER scheduled_publish_date;


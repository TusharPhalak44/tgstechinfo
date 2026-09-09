-- Add webinar_date column to contents table
-- This will store the scheduled date/time for webinar content
ALTER TABLE contents ADD COLUMN webinar_date DATETIME NULL AFTER scheduled_publish_date;

-- Add index for better performance on webinar date queries
CREATE INDEX idx_webinar_date ON contents(webinar_date);
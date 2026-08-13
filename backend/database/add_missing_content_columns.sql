-- ─────────────────────────────────────────────────────────────────────────────
-- Add Missing Columns to contents Table
-- This migration ensures all columns required by Content.js model exist
-- Safe to run multiple times (IF NOT EXISTS guard)
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE contents
-- Webhook fields
ADD COLUMN IF NOT EXISTS webhook_url TEXT NULL AFTER custom_fields,
ADD COLUMN IF NOT EXISTS webhook_field_mapping JSON NULL AFTER webhook_url,

-- Builder fields
ADD COLUMN IF NOT EXISTS builder_layout JSON NULL AFTER webhook_field_mapping,
ADD COLUMN IF NOT EXISTS builder_content_elements LONGTEXT NULL AFTER builder_layout,
ADD COLUMN IF NOT EXISTS builder_page_data LONGTEXT NULL AFTER builder_content_elements,

-- SEO fields
ADD COLUMN IF NOT EXISTS seo_meta_title VARCHAR(255) NULL AFTER builder_page_data,
ADD COLUMN IF NOT EXISTS seo_meta_description TEXT NULL AFTER seo_meta_title,
ADD COLUMN IF NOT EXISTS seo_meta_keywords VARCHAR(500) NULL AFTER seo_meta_description,

-- Scheduling and visibility fields
ADD COLUMN IF NOT EXISTS scheduled_publish_date DATETIME NULL AFTER seo_meta_keywords,
ADD COLUMN IF NOT EXISTS reading_time INT NULL AFTER scheduled_publish_date,
ADD COLUMN IF NOT EXISTS is_visible_on_site BOOLEAN DEFAULT TRUE AFTER reading_time,

-- Case study and email fields
ADD COLUMN IF NOT EXISTS email_subject VARCHAR(500) NULL AFTER is_visible_on_site,
ADD COLUMN IF NOT EXISTS email_template LONGTEXT NULL AFTER email_subject,
ADD COLUMN IF NOT EXISTS case_study_headline VARCHAR(500) NULL AFTER email_template,
ADD COLUMN IF NOT EXISTS case_study_summary VARCHAR(1000) NULL AFTER case_study_headline;

-- Verify columns were added
SELECT 
    COLUMN_NAME,
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'contents'
  AND COLUMN_NAME IN (
    'webhook_url', 'webhook_field_mapping', 'builder_layout', 'builder_content_elements',
    'builder_page_data', 'seo_meta_title', 'seo_meta_description', 'seo_meta_keywords',
    'scheduled_publish_date', 'reading_time', 'is_visible_on_site',
    'email_subject', 'email_template', 'case_study_headline', 'case_study_summary'
  )
ORDER BY ORDINAL_POSITION;

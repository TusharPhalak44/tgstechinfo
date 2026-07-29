-- Migration: add builder_page_data column for v2.0 Visual Builder persistence
-- Run once against the CMS database.
-- Safe to run multiple times (IF NOT EXISTS guard).

ALTER TABLE contents
    ADD COLUMN IF NOT EXISTS builder_page_data LONGTEXT NULL
        COMMENT 'v2.0 Visual Builder full page tree (JSON)' AFTER builder_content_elements;

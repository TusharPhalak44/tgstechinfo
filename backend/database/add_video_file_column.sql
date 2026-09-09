-- Add video_file column to contents table
ALTER TABLE contents ADD COLUMN video_file VARCHAR(255) DEFAULT NULL AFTER pdf_file;
-- Rollback script to remove new columns if needed
-- Run this only if you want to revert the changes

ALTER TABLE users DROP COLUMN IF EXISTS country;
ALTER TABLE users DROP COLUMN IF EXISTS job_title;
ALTER TABLE users DROP COLUMN IF EXISTS company_name;

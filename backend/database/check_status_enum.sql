-- Check the current ENUM values for status column in contents table
SELECT COLUMN_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'contents' 
  AND COLUMN_NAME = 'status'
  AND TABLE_SCHEMA = DATABASE();

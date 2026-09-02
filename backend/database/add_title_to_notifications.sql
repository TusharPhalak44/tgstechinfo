-- Add title column to notifications table
ALTER TABLE notifications ADD COLUMN title VARCHAR(255) NULL AFTER type;

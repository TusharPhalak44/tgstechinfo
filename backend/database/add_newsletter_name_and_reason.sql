-- Migration: Add name and unsubscribe_reason to newsletter_subscribers
-- Safe alter commands

ALTER TABLE `newsletter_subscribers` 
ADD COLUMN IF NOT EXISTS `name` VARCHAR(255) NULL AFTER `email`;

ALTER TABLE `newsletter_subscribers` 
ADD COLUMN IF NOT EXISTS `unsubscribe_reason` TEXT NULL AFTER `unsubscribed_at`;


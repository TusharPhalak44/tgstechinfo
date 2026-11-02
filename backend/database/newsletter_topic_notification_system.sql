-- ==============================================================================
-- TGS TECH INFO: Newsletter & Topic-Based Automated Notification System Migration
-- Compatible with MySQL 5.7+ and MySQL 8.0+
-- ==============================================================================

-- 1. Enhance newsletter_subscribers with preference flags (backward-compatible)
ALTER TABLE `newsletter_subscribers`
  ADD COLUMN `preferences_instant_alerts` TINYINT(1) NOT NULL DEFAULT 1,
  ADD COLUMN `preferences_weekly_digest` TINYINT(1) NOT NULL DEFAULT 1,
  ADD COLUMN `preferences_general_alerts` TINYINT(1) NOT NULL DEFAULT 1,
  ADD COLUMN `preferences_technology_alerts` TINYINT(1) NOT NULL DEFAULT 1,
  ADD COLUMN `preferences_industry_alerts` TINYINT(1) NOT NULL DEFAULT 1,
  ADD COLUMN `last_active_source` VARCHAR(100) NULL DEFAULT 'general';

-- 2. Subscriber Topic & Taxonomy Interests
CREATE TABLE IF NOT EXISTS `newsletter_subscription_interests` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `subscriber_id` BIGINT UNSIGNED NOT NULL,
  `interest_type` ENUM('general', 'technology', 'industry') NOT NULL DEFAULT 'general',
  `interest_value` VARCHAR(150) NOT NULL DEFAULT 'all',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_sub_interest` (`subscriber_id`, `interest_type`, `interest_value`),
  INDEX `idx_interest_lookup` (`interest_type`, `interest_value`, `is_active`),
  INDEX `idx_sub_id` (`subscriber_id`),
  CONSTRAINT `fk_sub_interests` FOREIGN KEY (`subscriber_id`) REFERENCES `newsletter_subscribers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Subscription History & Activity Log (preserves every entry point)
CREATE TABLE IF NOT EXISTS `newsletter_subscription_activities` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `subscriber_id` BIGINT UNSIGNED NOT NULL,
  `subscription_source` VARCHAR(100) NOT NULL,
  `source_page_url` VARCHAR(1000) NULL,
  `source_page_title` VARCHAR(500) NULL,
  `interest_type` VARCHAR(50) NULL,
  `interest_value` VARCHAR(150) NULL,
  `content_id` INT NULL,
  `content_type` VARCHAR(50) NULL,
  `ip_address` VARCHAR(45) NULL,
  `user_agent` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_act_subscriber` (`subscriber_id`),
  INDEX `idx_act_source` (`subscription_source`),
  INDEX `idx_act_created` (`created_at`),
  CONSTRAINT `fk_sub_activities` FOREIGN KEY (`subscriber_id`) REFERENCES `newsletter_subscribers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Notification History & Strict Duplicate Prevention Table
CREATE TABLE IF NOT EXISTS `newsletter_notification_logs` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `subscriber_id` BIGINT UNSIGNED NOT NULL,
  `content_id` INT NOT NULL,
  `notification_type` ENUM('instant_publish', 'weekly_digest') NOT NULL DEFAULT 'instant_publish',
  `matched_interest_type` VARCHAR(50) NOT NULL,
  `matched_interest_value` VARCHAR(150) NOT NULL,
  `email_status` ENUM('queued', 'sent', 'failed', 'bounced', 'skipped') NOT NULL DEFAULT 'queued',
  `attempt_count` INT NOT NULL DEFAULT 0,
  `error_message` TEXT NULL,
  `sent_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_sub_content_notif` (`subscriber_id`, `content_id`, `notification_type`),
  INDEX `idx_notif_content` (`content_id`),
  INDEX `idx_notif_status` (`email_status`),
  INDEX `idx_notif_created` (`created_at`),
  CONSTRAINT `fk_notif_subscriber` FOREIGN KEY (`subscriber_id`) REFERENCES `newsletter_subscribers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_notif_content` FOREIGN KEY (`content_id`) REFERENCES `contents` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Persistent Background Email Queue (Hostinger VPS & Transactional Safe)
CREATE TABLE IF NOT EXISTS `newsletter_email_queue` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `subscriber_id` BIGINT UNSIGNED NOT NULL,
  `recipient_email` VARCHAR(255) NOT NULL,
  `recipient_name` VARCHAR(255) NULL,
  `subject` VARCHAR(500) NOT NULL,
  `html_content` LONGTEXT NOT NULL,
  `content_id` INT NULL,
  `job_type` ENUM('welcome_general', 'welcome_topic', 'welcome_content', 'instant_content_alert', 'weekly_campaign') NOT NULL,
  `status` ENUM('pending', 'processing', 'completed', 'failed', 'exhausted') NOT NULL DEFAULT 'pending',
  `attempt_count` INT NOT NULL DEFAULT 0,
  `max_attempts` INT NOT NULL DEFAULT 3,
  `last_error` TEXT NULL,
  `scheduled_for` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `processed_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_queue_exec` (`status`, `scheduled_for`),
  INDEX `idx_queue_sub` (`subscriber_id`),
  INDEX `idx_queue_content` (`content_id`),
  CONSTRAINT `fk_queue_subscriber` FOREIGN KEY (`subscriber_id`) REFERENCES `newsletter_subscribers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Content-Type Notification Master Switches (Admin Configurable)
CREATE TABLE IF NOT EXISTS `newsletter_notification_settings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `setting_key` VARCHAR(100) UNIQUE NOT NULL,
  `setting_value` VARCHAR(255) NOT NULL,
  `description` VARCHAR(255) NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed default master settings for all 11 content types
INSERT IGNORE INTO `newsletter_notification_settings` (`setting_key`, `setting_value`, `description`) VALUES
('notify_article', '1', 'Enable automated notifications for newly published Articles'),
('notify_news', '1', 'Enable automated notifications for newly published News'),
('notify_blog', '1', 'Enable automated notifications for newly published Blogs'),
('notify_whitepaper', '1', 'Enable automated notifications for newly published Whitepapers'),
('notify_ebook', '1', 'Enable automated notifications for newly published eBooks'),
('notify_case_study', '1', 'Enable automated notifications for newly published Case Studies'),
('notify_interview', '1', 'Enable automated notifications for newly published Interviews'),
('notify_webinar', '1', 'Enable automated notifications for newly published Webinars'),
('notify_event', '1', 'Enable automated notifications for newly published Events'),
('notify_guide', '1', 'Enable automated notifications for newly published Guides'),
('notify_report', '1', 'Enable automated notifications for newly published Reports'),
('notify_general_enabled', '1', 'Master switch for all General Subscribers'),
('notify_topics_enabled', '1', 'Master switch for all Topic Subscribers'),
('queue_batch_size', '15', 'Number of notification emails processed per queue batch'),
('queue_delay_seconds', '2', 'Delay between consecutive email sends');

-- 7. Safe Migration for Existing Subscribers:
-- Ensure existing subscribers have an initial 'general' / 'all' interest record if none exists
INSERT IGNORE INTO `newsletter_subscription_interests` (`subscriber_id`, `interest_type`, `interest_value`, `is_active`)
SELECT `id`, 'general', 'all', `is_active`
FROM `newsletter_subscribers`
WHERE `id` NOT IN (SELECT DISTINCT `subscriber_id` FROM `newsletter_subscription_interests`);


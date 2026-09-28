-- ============================================================================
-- Migration: Phase 5 - Add Foreign Key Constraints to Contents Table
-- Target Database: publishing_platform
-- Target Engine: MariaDB 10.4 / MySQL InnoDB
-- Created: 2026-09-26
--
-- Safety Guarantees:
-- 1. Does NOT delete any existing content or data.
-- 2. Compatible with existing NULL foreign-reference values.
-- 3. ON DELETE SET NULL ensures deleting an author does NOT cascade-delete articles.
-- 4. ON UPDATE CASCADE ensures user ID updates seamlessly propagate.
-- ============================================================================

-- ============================================================================
-- 1. FOREIGN KEY: contents.user_id -> users.id
-- Status: VERIFIED COMPATIBLE
-- Both columns are bigint(20) unsigned. Child allows NULL. Index exists.
-- ============================================================================

ALTER TABLE `contents`
    ADD CONSTRAINT `fk_contents_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE;

-- ============================================================================
-- 2. FOREIGN KEYS FOR category_id AND content_type_id (HELD PENDING COLUMN MIGRATION)
-- Status: BLOCKED / REQUIRES DOCUMENTED COLUMN MODIFICATION
--
-- Technical Blocker Details:
-- - `contents.category_id` is defined as `int(11) DEFAULT NULL` (signed 32-bit integer).
--   Referenced `categories.id` is `bigint(20) unsigned NOT NULL` (unsigned 64-bit integer).
-- - `contents.content_type_id` is defined as `int(11) DEFAULT NULL` (signed 32-bit integer).
--   Referenced `content_types.id` is `bigint(20) unsigned NOT NULL` (unsigned 64-bit integer).
--
-- InnoDB requires EXACT match of integer size and signedness for foreign keys.
-- Attempting to add FKs without altering column definitions results in MariaDB Error 150 / 1005:
-- "Foreign key constraint is incorrectly formed".
--
-- In accordance with Phase 5 Critical Safety Rules:
-- "A foreign key must not be added until the column definitions are compatible.
--  If a column requires modification, document it first. Do not modify it automatically."
--
-- Once approved by administrator, the following statements can safely align the types and add FKs:
--
--   ALTER TABLE `contents`
--       MODIFY COLUMN `category_id` bigint(20) unsigned DEFAULT NULL,
--       MODIFY COLUMN `content_type_id` bigint(20) unsigned DEFAULT NULL;
--
--   ALTER TABLE `contents`
--       ADD CONSTRAINT `fk_contents_category`
--       FOREIGN KEY (`category_id`)
--       REFERENCES `categories` (`id`)
--       ON DELETE SET NULL
--       ON UPDATE CASCADE;
--
--   ALTER TABLE `contents`
--       ADD CONSTRAINT `fk_contents_content_type`
--       FOREIGN KEY (`content_type_id`)
--       REFERENCES `content_types` (`id`)
--       ON DELETE SET NULL
--       ON UPDATE CASCADE;
-- ============================================================================

-- ============================================================================
-- ROLLBACK / DOWN MIGRATION:
-- To reverse this migration, execute:
--
-- ALTER TABLE `contents` DROP FOREIGN KEY `fk_contents_user`;
-- ============================================================================

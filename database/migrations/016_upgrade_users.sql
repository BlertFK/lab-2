-- B09: Migrate Users table to spec schema
-- Adds first_name, last_name, password_hash, phone, avatar_file_id, is_active,
-- email_verified_at, last_login_at, updated_at.
-- Migrates data from legacy columns (name -> first_name + last_name, password -> password_hash).
-- Keeps the legacy `name`, `password`, `role` columns for now so existing
-- Fadil/legacy code continues to work during transition.

USE realestate_db;

ALTER TABLE users
  ADD COLUMN first_name VARCHAR(60) NULL AFTER id,
  ADD COLUMN last_name VARCHAR(60) NULL AFTER first_name,
  ADD COLUMN password_hash VARCHAR(255) NULL AFTER password,
  ADD COLUMN phone VARCHAR(30) NULL AFTER password_hash,
  ADD COLUMN avatar_file_id BIGINT UNSIGNED NULL AFTER phone,
  ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1 AFTER avatar_file_id,
  ADD COLUMN email_verified_at TIMESTAMP NULL AFTER is_active,
  ADD COLUMN last_login_at TIMESTAMP NULL AFTER email_verified_at,
  ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at;

-- Populate first_name/last_name from legacy `name`
UPDATE users
SET
  first_name = TRIM(SUBSTRING_INDEX(name, ' ', 1)),
  last_name  = TRIM(SUBSTRING(name, LOCATE(' ', name) + 1))
WHERE first_name IS NULL AND name IS NOT NULL;

UPDATE users
SET last_name = ''
WHERE last_name IS NULL OR last_name = first_name;

-- Copy legacy password into password_hash
UPDATE users
SET password_hash = password
WHERE password_hash IS NULL AND password IS NOT NULL;

-- Tighten constraints now that data is populated
ALTER TABLE users
  MODIFY first_name VARCHAR(60) NOT NULL,
  MODIFY last_name VARCHAR(60) NOT NULL DEFAULT '',
  MODIFY password_hash VARCHAR(255) NOT NULL,
  MODIFY email VARCHAR(150) NOT NULL;

-- Ensure email is uniquely indexed (idempotent guard)
SET @idx := NULL;
SELECT INDEX_NAME INTO @idx
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'users'
  AND COLUMN_NAME = 'email'
  AND NON_UNIQUE = 0
LIMIT 1;
SET @sql := IF(@idx IS NULL, 'ALTER TABLE users ADD UNIQUE KEY uq_users_email (email)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

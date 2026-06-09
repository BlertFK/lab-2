-- B-align: bring pre-existing Blert tables in line with what the code expects.
-- Idempotent. Avoids touching primary keys (existing FKs make that fragile under MySQL 5.x/8.0).
USE realestate_db;

-- ── user_roles: add assigned_by; treat existing created_at as assigned_at ──
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_roles' AND COLUMN_NAME = 'assigned_by');
SET @sql := IF(@c = 0,
  'ALTER TABLE user_roles ADD COLUMN assigned_by INT NULL',
  'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- ── settings: rename setting_key/setting_value → key/value, relax NOT NULL on value ──
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'settings' AND COLUMN_NAME = 'setting_key');
SET @sql := IF(@c > 0,
  'ALTER TABLE settings CHANGE setting_key `key` VARCHAR(100) NOT NULL',
  'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'settings' AND COLUMN_NAME = 'setting_value');
SET @sql := IF(@c > 0,
  'ALTER TABLE settings CHANGE setting_value `value` LONGTEXT NULL',
  'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'settings' AND COLUMN_NAME = 'value' AND IS_NULLABLE = 'NO');
SET @sql := IF(@c > 0,
  'ALTER TABLE settings MODIFY COLUMN `value` LONGTEXT NULL',
  'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- ── refresh_tokens: collapse duplicate `replaced_by_token_id` into `replaced_by` ──
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'refresh_tokens' AND COLUMN_NAME = 'replaced_by_token_id');
SET @sql := IF(@c > 0,
  'UPDATE refresh_tokens SET replaced_by = COALESCE(replaced_by, replaced_by_token_id) WHERE replaced_by_token_id IS NOT NULL',
  'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'refresh_tokens' AND COLUMN_NAME = 'replaced_by_token_id');
SET @sql := IF(@c > 0,
  'ALTER TABLE refresh_tokens DROP COLUMN replaced_by_token_id',
  'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- B27: Settings table (key/value with typed parsing)
USE realestate_db;

CREATE TABLE IF NOT EXISTS settings (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `key`       VARCHAR(80) NOT NULL,
  value       TEXT NULL,
  type        ENUM('string','number','boolean','json') NOT NULL DEFAULT 'string',
  description VARCHAR(255) NULL,
  is_public   TINYINT(1) NOT NULL DEFAULT 0,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  updated_by  BIGINT UNSIGNED NULL,
  UNIQUE KEY uq_settings_key (`key`),
  CONSTRAINT fk_settings_updated_by
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed sane defaults (Blert)
INSERT INTO settings (`key`, value, type, description, is_public) VALUES
  ('app.name',                     'RealEstate',  'string',  'Display name of the application',                1),
  ('app.support_email',            '',            'string',  'Public support email',                            1),
  ('listing.default_currency',     'EUR',         'string',  'Default currency for new listings',               1),
  ('listing.featured_days',        '7',           'number',  'How many days a featured listing stays boosted',  0),
  ('search.results_per_page',      '20',          'number',  'Default page size for search results',            1),
  ('uploads.max_size_mb',          '10',          'number',  'Maximum upload size in MB',                       1),
  ('notifications.realtime',       'true',        'boolean', 'Enable real-time notification dispatch',          0),
  ('maintenance.mode',             'false',       'boolean', 'When true the API returns 503 for write actions', 1)
ON DUPLICATE KEY UPDATE description = VALUES(description), type = VALUES(type), is_public = VALUES(is_public);

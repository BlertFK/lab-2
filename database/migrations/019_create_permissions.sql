-- B10: Permissions table
USE realestate_db;

CREATE TABLE IF NOT EXISTS permissions (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(80) NOT NULL,
  description VARCHAR(255) NULL,
  resource    VARCHAR(50) NOT NULL,
  UNIQUE KEY uq_permissions_name (name),
  INDEX idx_permissions_resource (resource)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

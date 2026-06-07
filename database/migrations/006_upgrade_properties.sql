USE realestate_db;

SET @fk = NULL;
SELECT CONSTRAINT_NAME INTO @fk
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'favorites'
  AND COLUMN_NAME = 'buyer_id'
  AND REFERENCED_TABLE_NAME = 'users'
LIMIT 1;
SET @sql = IF(@fk IS NULL, 'SELECT 1', CONCAT('ALTER TABLE favorites DROP FOREIGN KEY `', @fk, '`'));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @fk = NULL;
SELECT CONSTRAINT_NAME INTO @fk
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'favorites'
  AND COLUMN_NAME = 'property_id'
  AND REFERENCED_TABLE_NAME = 'properties'
LIMIT 1;
SET @sql = IF(@fk IS NULL, 'SELECT 1', CONCAT('ALTER TABLE favorites DROP FOREIGN KEY `', @fk, '`'));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @fk = NULL;
SELECT CONSTRAINT_NAME INTO @fk
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'messages'
  AND COLUMN_NAME = 'buyer_id'
  AND REFERENCED_TABLE_NAME = 'users'
LIMIT 1;
SET @sql = IF(@fk IS NULL, 'SELECT 1', CONCAT('ALTER TABLE messages DROP FOREIGN KEY `', @fk, '`'));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @fk = NULL;
SELECT CONSTRAINT_NAME INTO @fk
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'messages'
  AND COLUMN_NAME = 'seller_id'
  AND REFERENCED_TABLE_NAME = 'users'
LIMIT 1;
SET @sql = IF(@fk IS NULL, 'SELECT 1', CONCAT('ALTER TABLE messages DROP FOREIGN KEY `', @fk, '`'));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @fk = NULL;
SELECT CONSTRAINT_NAME INTO @fk
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'messages'
  AND COLUMN_NAME = 'property_id'
  AND REFERENCED_TABLE_NAME = 'properties'
LIMIT 1;
SET @sql = IF(@fk IS NULL, 'SELECT 1', CONCAT('ALTER TABLE messages DROP FOREIGN KEY `', @fk, '`'));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @fk = NULL;
SELECT CONSTRAINT_NAME INTO @fk
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'properties'
  AND COLUMN_NAME = 'seller_id'
  AND REFERENCED_TABLE_NAME = 'users'
LIMIT 1;
SET @sql = IF(@fk IS NULL, 'SELECT 1', CONCAT('ALTER TABLE properties DROP FOREIGN KEY `', @fk, '`'));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

ALTER TABLE users
  MODIFY id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT;

ALTER TABLE favorites
  MODIFY buyer_id BIGINT UNSIGNED NULL,
  MODIFY property_id BIGINT UNSIGNED NULL;

ALTER TABLE messages
  MODIFY buyer_id BIGINT UNSIGNED NULL,
  MODIFY seller_id BIGINT UNSIGNED NULL,
  MODIFY property_id BIGINT UNSIGNED NULL;

ALTER TABLE properties
  MODIFY id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  MODIFY title VARCHAR(200) NOT NULL,
  MODIFY description TEXT NULL,
  MODIFY price DECIMAL(12,2) NOT NULL,
  MODIFY seller_id BIGINT UNSIGNED NULL;

ALTER TABLE properties
  ADD COLUMN slug VARCHAR(220) NULL AFTER title,
  ADD COLUMN currency CHAR(3) NOT NULL DEFAULT 'EUR' AFTER price,
  ADD COLUMN area_m2 DECIMAL(8,2) NULL AFTER currency,
  ADD COLUMN rooms TINYINT NULL AFTER area_m2,
  ADD COLUMN bedrooms TINYINT NULL AFTER rooms,
  ADD COLUMN bathrooms TINYINT NULL AFTER bedrooms,
  ADD COLUMN floor TINYINT NULL AFTER bathrooms,
  ADD COLUMN total_floors TINYINT NULL AFTER floor,
  ADD COLUMN year_built SMALLINT NULL AFTER total_floors,
  ADD COLUMN type_id BIGINT UNSIGNED NULL AFTER year_built,
  ADD COLUMN category_id BIGINT UNSIGNED NULL AFTER type_id,
  ADD COLUMN location_id BIGINT UNSIGNED NULL AFTER category_id,
  ADD COLUMN agent_id BIGINT UNSIGNED NULL AFTER seller_id,
  ADD COLUMN agency_id BIGINT UNSIGNED NULL AFTER agent_id,
  ADD COLUMN views_count INT UNSIGNED NOT NULL DEFAULT 0 AFTER agency_id,
  ADD COLUMN featured_until TIMESTAMP NULL AFTER views_count,
  ADD COLUMN published_at TIMESTAMP NULL AFTER featured_until,
  ADD COLUMN created_by BIGINT UNSIGNED NULL AFTER published_at,
  ADD COLUMN updated_by BIGINT UNSIGNED NULL AFTER created_by,
  ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at;

UPDATE properties
SET slug = CONCAT(
  LOWER(
    TRIM(BOTH '-' FROM REPLACE(REPLACE(REPLACE(title, ' ', '-'), '/', '-'), '.', '-'))
  ),
  '-',
  id
)
WHERE slug IS NULL;

ALTER TABLE properties
  MODIFY slug VARCHAR(220) NOT NULL,
  MODIFY status ENUM('draft','available','reserved','sold','rented','archived') NOT NULL DEFAULT 'draft',
  ADD UNIQUE KEY uq_properties_slug (slug),
  ADD INDEX idx_properties_price (price),
  ADD INDEX idx_properties_type_id (type_id),
  ADD INDEX idx_properties_category_id (category_id),
  ADD INDEX idx_properties_location_id (location_id),
  ADD INDEX idx_properties_status (status),
  ADD INDEX idx_properties_seller_id (seller_id),
  ADD INDEX idx_properties_agent_id (agent_id),
  ADD INDEX idx_properties_agency_id (agency_id),
  ADD FULLTEXT KEY ft_properties_title_description (title, description);

ALTER TABLE properties
  ADD CONSTRAINT fk_properties_type_id
    FOREIGN KEY (type_id) REFERENCES property_types(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT fk_properties_category_id
    FOREIGN KEY (category_id) REFERENCES categories(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT fk_properties_location_id
    FOREIGN KEY (location_id) REFERENCES locations(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT fk_properties_seller_id
    FOREIGN KEY (seller_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT fk_properties_created_by
    FOREIGN KEY (created_by) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT fk_properties_updated_by
    FOREIGN KEY (updated_by) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE favorites
  ADD CONSTRAINT fk_favorites_buyer_id
    FOREIGN KEY (buyer_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT fk_favorites_property_id
    FOREIGN KEY (property_id) REFERENCES properties(id)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE messages
  ADD CONSTRAINT fk_messages_buyer_id
    FOREIGN KEY (buyer_id) REFERENCES users(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT fk_messages_seller_id
    FOREIGN KEY (seller_id) REFERENCES users(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT fk_messages_property_id
    FOREIGN KEY (property_id) REFERENCES properties(id)
    ON DELETE RESTRICT ON UPDATE CASCADE;

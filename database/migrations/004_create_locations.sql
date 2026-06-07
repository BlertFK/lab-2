USE realestate_db;

CREATE TABLE IF NOT EXISTS locations (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  city_id BIGINT UNSIGNED NOT NULL,
  district VARCHAR(100) NULL,
  address_line VARCHAR(255) NULL,
  postal_code VARCHAR(20) NULL,
  latitude DECIMAL(10,7) NULL,
  longitude DECIMAL(10,7) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_locations_city_id (city_id),
  INDEX idx_locations_latitude_longitude (latitude, longitude),
  CONSTRAINT fk_locations_city_id
    FOREIGN KEY (city_id) REFERENCES cities(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


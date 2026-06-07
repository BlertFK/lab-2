USE realestate_db;

CREATE TABLE IF NOT EXISTS property_images (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  property_id BIGINT UNSIGNED NOT NULL,
  file_id BIGINT UNSIGNED NULL,
  image_url VARCHAR(500) NULL,
  sort_order TINYINT UNSIGNED NOT NULL DEFAULT 0,
  is_primary TINYINT(1) NOT NULL DEFAULT 0,
  caption VARCHAR(150) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_property_images_property_id (property_id),
  INDEX idx_property_images_file_id (file_id),
  INDEX idx_property_images_is_primary (is_primary),
  CONSTRAINT fk_property_images_property_id
    FOREIGN KEY (property_id) REFERENCES properties(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT chk_property_images_source CHECK (file_id IS NOT NULL OR image_url IS NOT NULL)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


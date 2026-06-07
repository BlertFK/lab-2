USE realestate_db;

CREATE TABLE IF NOT EXISTS property_amenities (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  property_id BIGINT UNSIGNED NOT NULL,
  amenity_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_property_amenities_property_amenity (property_id, amenity_id),
  INDEX idx_property_amenities_property_id (property_id),
  INDEX idx_property_amenities_amenity_id (amenity_id),
  CONSTRAINT fk_property_amenities_property_id
    FOREIGN KEY (property_id) REFERENCES properties(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_property_amenities_amenity_id
    FOREIGN KEY (amenity_id) REFERENCES amenities(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


USE realestate_db;

CREATE TABLE IF NOT EXISTS viewings (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  property_id BIGINT UNSIGNED NOT NULL,
  buyer_id BIGINT UNSIGNED NOT NULL,
  seller_id BIGINT UNSIGNED NOT NULL,
  scheduled_at DATETIME NOT NULL,
  duration_minutes TINYINT UNSIGNED NOT NULL DEFAULT 30,
  status ENUM('requested','confirmed','rejected','completed','cancelled') NOT NULL DEFAULT 'requested',
  notes TEXT NULL,
  cancelled_by BIGINT UNSIGNED NULL,
  cancelled_reason VARCHAR(255) NULL,
  created_by BIGINT UNSIGNED NULL,
  updated_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_viewings_property_id (property_id),
  INDEX idx_viewings_buyer_id (buyer_id),
  INDEX idx_viewings_seller_id (seller_id),
  INDEX idx_viewings_scheduled_at (scheduled_at),
  INDEX idx_viewings_status (status),
  CONSTRAINT fk_viewings_property_id
    FOREIGN KEY (property_id) REFERENCES properties(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_viewings_buyer_id
    FOREIGN KEY (buyer_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_viewings_seller_id
    FOREIGN KEY (seller_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_viewings_cancelled_by
    FOREIGN KEY (cancelled_by) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_viewings_created_by
    FOREIGN KEY (created_by) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_viewings_updated_by
    FOREIGN KEY (updated_by) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


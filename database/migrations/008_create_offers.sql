USE realestate_db;

CREATE TABLE IF NOT EXISTS offers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  property_id INT NOT NULL,
  buyer_id INT NOT NULL,
  seller_id INT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'EUR',
  message TEXT NULL,
  status ENUM('pending','accepted','rejected','countered','expired','withdrawn') NOT NULL DEFAULT 'pending',
  counter_offer_id INT NULL,
  expires_at TIMESTAMP NULL,
  created_by INT NULL,
  updated_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_offers_property_id (property_id),
  INDEX idx_offers_buyer_id (buyer_id),
  INDEX idx_offers_seller_id (seller_id),
  INDEX idx_offers_status (status),
  INDEX idx_offers_expires_at (expires_at),
  CONSTRAINT fk_offers_property_id
    FOREIGN KEY (property_id) REFERENCES properties(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_offers_buyer_id
    FOREIGN KEY (buyer_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_offers_seller_id
    FOREIGN KEY (seller_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_offers_counter_offer_id
    FOREIGN KEY (counter_offer_id) REFERENCES offers(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_offers_created_by
    FOREIGN KEY (created_by) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_offers_updated_by
    FOREIGN KEY (updated_by) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

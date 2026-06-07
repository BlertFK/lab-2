USE realestate_db;

CREATE TABLE IF NOT EXISTS transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  offer_id INT NULL,
  property_id INT NOT NULL,
  buyer_id INT NOT NULL,
  seller_id INT NOT NULL,
  agent_id INT NULL,
  amount DECIMAL(12,2) NOT NULL,
  commission_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  status ENUM('pending','in_progress','completed','cancelled','refunded') NOT NULL DEFAULT 'pending',
  payment_method ENUM('cash','bank_transfer','escrow','crypto') NULL,
  completed_at TIMESTAMP NULL,
  created_by INT NULL,
  updated_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_transactions_offer_id (offer_id),
  INDEX idx_transactions_property_id (property_id),
  INDEX idx_transactions_buyer_id (buyer_id),
  INDEX idx_transactions_seller_id (seller_id),
  INDEX idx_transactions_agent_id (agent_id),
  INDEX idx_transactions_status (status),
  CONSTRAINT fk_transactions_offer_id
    FOREIGN KEY (offer_id) REFERENCES offers(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_transactions_property_id
    FOREIGN KEY (property_id) REFERENCES properties(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_transactions_buyer_id
    FOREIGN KEY (buyer_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_transactions_seller_id
    FOREIGN KEY (seller_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_transactions_created_by
    FOREIGN KEY (created_by) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_transactions_updated_by
    FOREIGN KEY (updated_by) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

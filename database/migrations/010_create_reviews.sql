USE realestate_db;

CREATE TABLE IF NOT EXISTS reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  property_id INT NOT NULL,
  user_id INT NOT NULL,
  transaction_id INT NULL,
  rating TINYINT UNSIGNED NOT NULL,
  title VARCHAR(150) NULL,
  comment TEXT NOT NULL,
  is_verified TINYINT(1) NOT NULL DEFAULT 0,
  is_hidden TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_reviews_user_property (user_id, property_id),
  INDEX idx_reviews_property_id (property_id),
  INDEX idx_reviews_user_id (user_id),
  INDEX idx_reviews_transaction_id (transaction_id),
  CONSTRAINT chk_reviews_rating CHECK (rating BETWEEN 1 AND 5),
  CONSTRAINT fk_reviews_property_id
    FOREIGN KEY (property_id) REFERENCES properties(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_reviews_user_id
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_reviews_transaction_id
    FOREIGN KEY (transaction_id) REFERENCES transactions(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

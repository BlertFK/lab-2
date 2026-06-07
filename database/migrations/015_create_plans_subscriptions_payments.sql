USE realestate_db;

CREATE TABLE IF NOT EXISTS plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  slug VARCHAR(70) NOT NULL UNIQUE,
  price DECIMAL(8,2) NOT NULL DEFAULT 0,
  duration_days SMALLINT UNSIGNED NOT NULL DEFAULT 30,
  max_listings SMALLINT UNSIGNED NOT NULL DEFAULT 10,
  max_featured SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  features JSON NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS subscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  plan_id INT NOT NULL,
  started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NULL,
  status ENUM('active','cancelled','expired') NOT NULL DEFAULT 'active',
  auto_renew TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_subscriptions_plan_id (plan_id),
  INDEX idx_subscriptions_status (status),
  CONSTRAINT fk_subscriptions_user_id
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_subscriptions_plan_id
    FOREIGN KEY (plan_id) REFERENCES plans(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  subscription_id INT NULL,
  user_id INT NOT NULL,
  amount DECIMAL(8,2) NOT NULL DEFAULT 0,
  currency CHAR(3) NOT NULL DEFAULT 'EUR',
  provider VARCHAR(40) NOT NULL DEFAULT 'manual',
  provider_payment_id VARCHAR(120) NULL,
  status ENUM('pending','paid','failed','refunded') NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_payments_subscription_id (subscription_id),
  INDEX idx_payments_user_id (user_id),
  INDEX idx_payments_status (status),
  CONSTRAINT fk_payments_subscription_id
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_payments_user_id
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO plans (name, slug, price, duration_days, max_listings, max_featured, features, is_active)
VALUES
  ('Free', 'free', 0.00, 30, 10, 0, JSON_ARRAY('Up to 10 listings'), 1),
  ('Basic', 'basic', 9.99, 30, 25, 1, JSON_ARRAY('Up to 25 listings', '1 featured listing'), 1),
  ('Pro', 'pro', 19.99, 30, 100, 5, JSON_ARRAY('Up to 100 listings', '5 featured listings'), 1),
  ('Agency', 'agency', 49.99, 30, 500, 20, JSON_ARRAY('Up to 500 listings', '20 featured listings'), 1)
ON DUPLICATE KEY UPDATE
  price = VALUES(price),
  duration_days = VALUES(duration_days),
  max_listings = VALUES(max_listings),
  max_featured = VALUES(max_featured),
  features = VALUES(features),
  is_active = VALUES(is_active);

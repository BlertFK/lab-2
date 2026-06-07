USE realestate_db;

CREATE TABLE IF NOT EXISTS agencies (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  phone VARCHAR(20) NULL,
  address VARCHAR(255) NULL,
  city VARCHAR(100) NULL,
  state_province VARCHAR(100) NULL,
  postal_code VARCHAR(20) NULL,
  country VARCHAR(100) NULL,
  website VARCHAR(255) NULL,
  license_number VARCHAR(100) NOT NULL UNIQUE,
  founded_year INT NULL,
  description TEXT NULL,
  logo_url VARCHAR(500) NULL,
  status ENUM('active','inactive','suspended') NOT NULL DEFAULT 'active',
  created_by BIGINT UNSIGNED NULL,
  updated_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_agencies_status (status),
  INDEX idx_agencies_license_number (license_number),
  CONSTRAINT fk_agencies_created_by
    FOREIGN KEY (created_by) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_agencies_updated_by
    FOREIGN KEY (updated_by) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS agents (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL UNIQUE,
  agency_id BIGINT UNSIGNED NULL,
  license_number VARCHAR(100) NOT NULL UNIQUE,
  specialization VARCHAR(100) NULL,
  phone VARCHAR(20) NULL,
  bio TEXT NULL,
  profile_image_url VARCHAR(500) NULL,
  commission_rate DECIMAL(5,2) NOT NULL DEFAULT 5.00,
  verified TINYINT(1) NOT NULL DEFAULT 0,
  verified_at TIMESTAMP NULL,
  status ENUM('active','inactive','suspended') NOT NULL DEFAULT 'active',
  total_sales INT NOT NULL DEFAULT 0,
  total_revenue DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  created_by BIGINT UNSIGNED NULL,
  updated_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_agents_agency_id (agency_id),
  INDEX idx_agents_status (status),
  INDEX idx_agents_verified (verified),
  CONSTRAINT fk_agents_user_id
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_agents_agency_id
    FOREIGN KEY (agency_id) REFERENCES agencies(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_agents_created_by
    FOREIGN KEY (created_by) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_agents_updated_by
    FOREIGN KEY (updated_by) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


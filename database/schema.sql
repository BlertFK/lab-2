CREATE DATABASE IF NOT EXISTS realestate_db;
USE realestate_db;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin','buyer','seller') DEFAULT 'buyer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE properties (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  location VARCHAR(200),
  type VARCHAR(100),
  status ENUM('available','sold','rented') DEFAULT 'available',
  image_url VARCHAR(500),
  seller_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE favorites (
  id INT AUTO_INCREMENT PRIMARY KEY,
  buyer_id INT,
  property_id INT,
  UNIQUE KEY unique_buyer_property (buyer_id, property_id),
  FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

CREATE TABLE messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  buyer_id INT,
  seller_id INT,
  property_id INT,
  message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (buyer_id) REFERENCES users(id),
  FOREIGN KEY (seller_id) REFERENCES users(id),
  FOREIGN KEY (property_id) REFERENCES properties(id)
);

-- Default seeded users
-- admin@realestate.local  -> Admin123!
-- buyer@realestate.local  -> Buyer123!
-- seller@realestate.local -> Seller123!
INSERT IGNORE INTO users (name, email, password, role) VALUES
  ('Admin User', 'admin@realestate.local', '$2b$10$nNrR2SSG1FyCLDWyZdrcnOpRHyZHQ3GndeM6aIYrxULjbljCJxQ8W', 'admin'),  
  ('Buyer User', 'buyer@realestate.local', '$2b$10$GCIgPGgZqgmAs/sNdGA0he.ghm4CJmTuc5fEDDSd2djjRqNtRnv7C', 'buyer'),   
  ('Seller User', 'seller@realestate.local', '$2b$10$ojS8DTBxcSliAYb4a26hxO7w/Rr2iKFLIRozvg2V9SJ5N5lipHt1u', 'seller');

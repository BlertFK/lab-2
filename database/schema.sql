CREATE DATABASE IF NOT EXISTS realestate_db;
USE realestate_db;

CREATE TABLE IF NOT EXISTS  users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin','buyer','seller') DEFAULT 'buyer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS  properties (
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

CREATE TABLE IF NOT EXISTS  favorites (
  id INT AUTO_INCREMENT PRIMARY KEY,
  buyer_id INT,
  property_id INT,
  UNIQUE KEY unique_buyer_property (buyer_id, property_id),
  FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS  message_threads (
  id INT AUTO_INCREMENT PRIMARY KEY,
  property_id INT NULL,
  buyer_id INT NOT NULL,
  seller_id INT NOT NULL,
  last_message_at TIMESTAMP NULL,
  buyer_unread_count INT NOT NULL DEFAULT 0,
  seller_unread_count INT NOT NULL DEFAULT 0,
  is_archived TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_message_thread (property_id, buyer_id, seller_id),
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE SET NULL,
  FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS  messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  thread_id INT,
  sender_id INT,
  buyer_id INT,
  seller_id INT,
  property_id INT,
  message TEXT,
  body TEXT NOT NULL,
  attachment_file_id INT NULL,
  is_edited TINYINT(1) NOT NULL DEFAULT 0,
  edited_at TIMESTAMP NULL,
  read_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (thread_id) REFERENCES message_threads(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
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

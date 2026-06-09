-- B12: Seed default roles
USE realestate_db;

INSERT INTO roles (name, description, is_system) VALUES
  ('Admin',   'Full platform access',                        1),
  ('Manager', 'Operational management, no system settings',  1),
  ('Agent',   'Real estate agent acting on behalf of agency',0),
  ('Seller',  'Individual property seller',                  0),
  ('Buyer',   'Default role for new sign-ups',               0)
ON DUPLICATE KEY UPDATE description = VALUES(description), is_system = VALUES(is_system);

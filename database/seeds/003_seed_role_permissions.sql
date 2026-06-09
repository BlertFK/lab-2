-- B12: Map permissions to roles per spec section 6 (Permission Matrix)
USE realestate_db;

-- Admin: everything
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r.name = 'Admin';

-- Manager: most things except role/settings management, agents.create, cms.publish
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r JOIN permissions p ON p.name IN (
  'users.view',
  'permissions.view',
  'audit.view',
  'settings.view',
  'properties.view', 'properties.create', 'properties.update.any', 'properties.delete.any',
  'viewings.create', 'viewings.manage',
  'transactions.view', 'transactions.create', 'transactions.manage',
  'reviews.delete.any',
  'files.manage',
  'cms.view', 'cms.edit',
  'reports.view', 'reports.export',
  'payments.view',
  'search'
)
WHERE r.name = 'Manager';

-- Agent
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r JOIN permissions p ON p.name IN (
  'properties.view', 'properties.create', 'properties.update.own', 'properties.delete.own',
  'offers.create', 'offers.accept', 'offers.reject',
  'viewings.create', 'viewings.manage',
  'transactions.view', 'transactions.create', 'transactions.manage',
  'agencies.create', 'agencies.update.own',
  'reports.view', 'reports.export',
  'payments.view',
  'search'
)
WHERE r.name = 'Agent';

-- Seller
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r JOIN permissions p ON p.name IN (
  'properties.view', 'properties.create', 'properties.update.own', 'properties.delete.own',
  'offers.accept', 'offers.reject',
  'viewings.manage',
  'transactions.view', 'transactions.create', 'transactions.manage',
  'reports.view',
  'payments.view',
  'search'
)
WHERE r.name = 'Seller';

-- Buyer
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r JOIN permissions p ON p.name IN (
  'properties.view',
  'offers.create',
  'viewings.create',
  'transactions.view',
  'reviews.create', 'reviews.update.own',
  'payments.view',
  'search'
)
WHERE r.name = 'Buyer';

-- Backfill legacy seeded users (admin/buyer/seller) with their roles
INSERT IGNORE INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u JOIN roles r ON r.name = 'Admin'
WHERE u.email = 'admin@realestate.local';

INSERT IGNORE INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u JOIN roles r ON r.name = 'Buyer'
WHERE u.email = 'buyer@realestate.local';

INSERT IGNORE INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u JOIN roles r ON r.name = 'Seller'
WHERE u.email = 'seller@realestate.local';

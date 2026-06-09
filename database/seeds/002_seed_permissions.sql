-- B12: Seed permission catalogue (~30 permissions per spec section 6)
USE realestate_db;

INSERT INTO permissions (name, description, resource) VALUES
  ('users.view',                'List/view users',                       'users'),
  ('users.update',              'Update any user',                       'users'),
  ('users.delete',              'Delete (deactivate) any user',          'users'),
  ('roles.view',                'View roles',                            'roles'),
  ('roles.manage',              'Create/edit/delete roles + assignments','roles'),
  ('permissions.view',          'View permission catalogue',             'permissions'),
  ('audit.view',                'Read audit log',                        'audit'),
  ('settings.view',             'View app settings',                     'settings'),
  ('settings.manage',           'Edit app settings',                     'settings'),

  ('properties.view',           'View property listings',                'properties'),
  ('properties.create',         'Create a property listing',             'properties'),
  ('properties.update.own',     'Edit own listings',                     'properties'),
  ('properties.update.any',     'Edit any listing',                      'properties'),
  ('properties.delete.own',     'Delete own listings',                   'properties'),
  ('properties.delete.any',     'Delete any listing',                    'properties'),

  ('offers.create',             'Submit an offer',                       'offers'),
  ('offers.accept',             'Accept an incoming offer',              'offers'),
  ('offers.reject',             'Reject an incoming offer',              'offers'),

  ('viewings.create',           'Request a viewing',                     'viewings'),
  ('viewings.manage',           'Confirm/cancel/complete viewings',      'viewings'),

  ('transactions.view',         'View transactions',                     'transactions'),
  ('transactions.create',       'Create a transaction',                  'transactions'),
  ('transactions.manage',       'Complete/refund transactions',          'transactions'),

  ('reviews.create',            'Write a review',                        'reviews'),
  ('reviews.update.own',        'Edit own review',                       'reviews'),
  ('reviews.delete.any',        'Hide/delete any review',                'reviews'),

  ('agencies.create',           'Create an agency',                      'agencies'),
  ('agencies.update.own',       'Edit own agency',                       'agencies'),
  ('agents.create',             'Create an agent',                       'agents'),

  ('files.manage',              'Manage all uploaded files',             'files'),

  ('cms.view',                  'View CMS pages',                        'cms'),
  ('cms.edit',                  'Edit CMS pages/sections/blocks',        'cms'),
  ('cms.publish',               'Publish CMS draft versions',            'cms'),

  ('reports.view',              'View/generate reports',                 'reports'),
  ('reports.export',            'Export reports to CSV/XLSX/PDF',        'reports'),

  ('payments.view',             'View payments',                         'payments'),
  ('search',                    'Use universal search',                  'search')
ON DUPLICATE KEY UPDATE description = VALUES(description), resource = VALUES(resource);

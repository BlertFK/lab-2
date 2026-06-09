SOURCE database/schema.sql;
SOURCE database/migrations/001_create_property_types.sql;
SOURCE database/migrations/002_create_categories.sql;
SOURCE database/migrations/003_create_cities.sql;
SOURCE database/migrations/004_create_locations.sql;
SOURCE database/migrations/005_create_amenities.sql;
SOURCE database/migrations/006_upgrade_properties.sql;
SOURCE database/migrations/007_create_viewings.sql;
SOURCE database/migrations/008_create_offers.sql;
SOURCE database/migrations/009_create_transactions.sql;
SOURCE database/migrations/010_create_reviews.sql;
SOURCE database/migrations/011_create_property_amenities.sql;
SOURCE database/migrations/012_create_property_images.sql;
SOURCE database/migrations/013_create_agencies_agents.sql;
SOURCE database/migrations/014_create_message_threads.sql;
SOURCE database/migrations/015_create_plans_subscriptions_payments.sql;
-- Blert: foundation + RBAC + refresh tokens
SOURCE database/migrations/016_upgrade_users.sql;
SOURCE database/migrations/017_create_roles.sql;
SOURCE database/migrations/018_create_user_roles.sql;
SOURCE database/migrations/019_create_permissions.sql;
SOURCE database/migrations/020_create_role_permissions.sql;
SOURCE database/migrations/021_create_refresh_tokens.sql;
-- Lis: files + CMS
SOURCE database/migrations/022_files_and_cms.sql;
-- Blert: audit, notifications, settings
SOURCE database/migrations/025_create_audit_logs.sql;
SOURCE database/migrations/026_create_notifications.sql;
SOURCE database/migrations/027_create_settings.sql;
-- Blert: align pre-existing tables with code expectations (idempotent)
SOURCE database/migrations/028_align_blert_tables.sql;
-- Seeds
SOURCE database/seeds/001_seed_roles.sql;
SOURCE database/seeds/002_seed_permissions.sql;
SOURCE database/seeds/003_seed_role_permissions.sql;
SOURCE database/seeds/010_seed_lookups.sql;
SOURCE database/seeds/011_seed_demo_properties.sql;
SOURCE database/seeds/012_seed_agencies_agents.sql;
SOURCE database/seeds/013_seed_plans.sql;

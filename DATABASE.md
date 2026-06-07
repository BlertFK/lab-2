# Database Documentation

Project: RealEstate Platform  
Owner track: Fadil - Database, Domain Logic, Reports

## ERD Artifacts

The current ERD artifacts are stored in:

- `database/erd.dbml`
- `database/ERD.png`

The DBML documents the full target schema from the Fadil specification. The PNG is a visual export of that ERD and highlights the tables implemented by the current migrations.

## Current Migration Set

Run migrations in numeric order:

1. `database/migrations/001_create_property_types.sql`
2. `database/migrations/002_create_categories.sql`
3. `database/migrations/003_create_cities.sql`
4. `database/migrations/004_create_locations.sql`
5. `database/migrations/005_create_amenities.sql`
6. `database/migrations/006_upgrade_properties.sql`
7. `database/migrations/007_create_viewings.sql`
8. `database/migrations/008_create_offers.sql`
9. `database/migrations/009_create_transactions.sql`
10. `database/migrations/010_create_reviews.sql`
11. `database/migrations/011_create_property_amenities.sql`
12. `database/migrations/012_create_property_images.sql`

The original baseline schema remains in `database/schema.sql`.

## Implemented Domain Tables

### Lookup Tables

- `property_types`
- `categories`
- `cities`
- `locations`
- `amenities`

These support the normalized property schema from the specification. `locations` references `cities`, and properties can reference lookup rows through `type_id`, `category_id`, and `location_id`.

### Properties

Migration `006_upgrade_properties.sql` upgrades the existing `properties` table with the main specification fields:

- `slug`
- `currency`
- `area_m2`
- `rooms`
- `bedrooms`
- `bathrooms`
- `floor`
- `total_floors`
- `year_built`
- `type_id`
- `category_id`
- `location_id`
- `agent_id`
- `agency_id`
- `views_count`
- `featured_until`
- `published_at`
- `created_by`
- `updated_by`
- `updated_at`

It also adds important indexes, including price, status, seller, lookup foreign keys, and FULLTEXT search on `title` and `description`.

Compatibility note: the current app still uses legacy property fields such as `location`, `type`, and `image_url`. The migration keeps those fields so existing controllers and frontend pages continue to work.

### Property Relations

- `property_amenities`
- `property_images`
- `favorites`

`property_amenities` supports many-to-many property amenities.  
`property_images` supports ordered property images, primary image selection, optional `file_id`, and URL-based images for compatibility with the current implementation.

### Business Workflow Tables

- `viewings`
- `offers`
- `transactions`
- `reviews`

These tables support the current F25-F33 backend modules:

- Viewing requests and status updates
- Offers and counter-offers
- Accepted offers creating transactions
- Transaction status transitions
- Verified reviews from completed transactions

## Backend Modules Using These Tables

Current domain backend support includes:

- `backend/routes/viewingRoutes.js`
- `backend/routes/offerRoutes.js`
- `backend/routes/transactionRoutes.js`
- `backend/routes/reviewRoutes.js`
- `backend/routes/propertyAmenityRoutes.js`
- `backend/routes/propertyImageRoutes.js`
- `backend/routes/reportRoutes.js`

The corresponding controllers, services, and repositories are in:

- `backend/controllers`
- `backend/services`
- `backend/repositories`
- `backend/validators`

## Report Tables

The report service currently supports:

- Sales by Period
- Listings by Status
- Top Properties by Views

The service is implemented in `backend/services/reportService.js`. CSV and Excel export support is implemented in `backend/services/reportExportService.js`.

## Known Schema Gaps

The ERD includes target tables that are not yet implemented as migrations in the current codebase:

- `agencies`
- `agents`
- `message_threads`
- upgraded `messages`
- `plans`
- `subscriptions`
- `payments`
- `files`
- CMS tables from Lis's track
- full Blert auth/RBAC/audit/notification tables

Because `agencies`, `agents`, and `files` are not migrated yet, some future-facing columns such as `properties.agent_id`, `properties.agency_id`, and `property_images.file_id` are present but do not yet enforce foreign keys.

## Normalization Notes

The domain schema separates lookup and relationship data from core property data:

- Property type, category, city, location, and amenity data are normalized into dedicated tables.
- Property amenities are represented as a many-to-many join table.
- Offers, viewings, transactions, and reviews are independent business entities with foreign keys back to properties and users.
- Status columns are indexed where implemented.
- Property search uses a FULLTEXT index on `title` and `description`.

This structure is aligned with the specification goal of a normalized, extensible real estate domain model.


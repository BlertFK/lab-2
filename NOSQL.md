# NoSQL Documentation

Project: RealEstate Platform  
Owner track: Fadil - MongoDB / NoSQL portion

## Current Status

MongoDB is documented in the Fadil specification, but it is not implemented in the current repository.

The current backend uses MySQL through:

- `backend/config/db.js`
- `mysql2`

There is no current MongoDB connection file, Mongoose setup, Mongo model directory, or archive job in the implemented codebase.

## NoSQL Scope From Specification

The specification expects MongoDB support for:

- `ChatMessageArchive`
- `AuditLogArchive`
- `PropertyViewLog`
- nightly Mongo archiver job
- top properties report using Mongo view logs

Expected target files from the specification include:

- `backend/config/mongo.js`
- `backend/models/mongo/ChatMessageArchive.js`
- `backend/models/mongo/AuditLogArchive.js`
- `backend/models/mongo/PropertyViewLog.js`
- `backend/jobs/mongoArchiver.job.js`

These files do not currently exist.

## Current Report Behavior

`backend/services/reportService.js` includes a Top Properties by Views report.

Current behavior:

- If a SQL `property_view_logs` table exists, it can use that table.
- If no view-log table exists, it falls back to `properties.views_count`.
- If neither source has real data, view counts are effectively zero.

This means the current Top Properties report is functional as a SQL-backed report, but it does not yet satisfy the MongoDB-specific requirement for F59.

## Intended Mongo Collections

### PropertyViewLog

Purpose: store property view events without growing MySQL tables too aggressively.

Suggested fields:

- `property_id`
- `user_id`
- `ip_address`
- `user_agent`
- `viewed_at`
- `source`

Usage:

- A property details endpoint or view-tracking endpoint writes one document per property view.
- The Top Properties report aggregates these documents by `property_id` and date range.

### ChatMessageArchive

Purpose: move old chat messages from MySQL to MongoDB while preserving searchable history.

Suggested fields:

- `message_id`
- `thread_id`
- `property_id`
- `buyer_id`
- `seller_id`
- `sender_id`
- `body`
- `attachment_file_id`
- `created_at`
- `archived_at`

Usage:

- A scheduled archiver moves older MySQL messages into MongoDB.
- MySQL keeps recent operational records.
- MongoDB stores long-term message history.

### AuditLogArchive

Purpose: preserve old audit log records for compliance and investigation without keeping all historical logs in MySQL.

Suggested fields:

- `audit_log_id`
- `user_id`
- `action`
- `entity`
- `entity_id`
- `old_value`
- `new_value`
- `ip_address`
- `user_agent`
- `created_at`
- `archived_at`

## Archiving Strategy

The intended nightly job should:

1. Connect to MySQL and MongoDB.
2. Select old records from MySQL based on a retention window.
3. Insert archive documents into MongoDB.
4. Delete or mark archived MySQL rows only after successful Mongo writes.
5. Log the archive count and failures.

Recommended retention windows:

- Messages: archive after 90 days.
- Audit logs: archive after 180 days.
- Property view logs: write directly to MongoDB instead of archiving from MySQL.

## Current Gaps

The following NoSQL items are still missing:

- MongoDB dependency and connection setup
- Mongoose models
- Mongo archive job
- View tracking endpoint writing to MongoDB
- Top Properties report aggregation from MongoDB
- Operational documentation for MongoDB environment variables

## Environment Variables To Add Later

When MongoDB is implemented, add environment variables such as:

```env
MONGO_URI=mongodb://localhost:27017/realestate
MONGO_ARCHIVE_ENABLED=true
MONGO_ARCHIVE_CRON=0 2 * * *
```

## Summary

The current repository documents the intended NoSQL design but does not yet implement MongoDB. The SQL domain and report features are partially implemented, while the Mongo-specific requirements remain future work.


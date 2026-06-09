# NoSQL Documentation

Project: RealEstate Platform  
Owner track: Fadil - MongoDB / NoSQL portion

## Current Status

MongoDB is implemented as an optional NoSQL layer alongside the existing MySQL database.

The backend always keeps the SQL application flow available. If MongoDB is not configured or cannot connect, the server logs the issue and continues with SQL fallback behavior.

Implemented files:

- `backend/config/mongo.js`
- `backend/models/mongo/PropertyViewLog.js`
- `backend/models/mongo/ChatMessageArchive.js`
- `backend/models/mongo/AuditLogArchive.js`
- `backend/jobs/mongoArchiver.job.js`
- `backend/services/propertyViewLogService.js`

## Mongo Connection

MongoDB connection setup lives in `backend/config/mongo.js`.

The connection helper reads:

- `MONGO_URI`
- `MONGODB_URI`
- `MONGO_CONNECT_TIMEOUT_MS`

`connectMongo()` is called during server startup in `backend/server.js` after the SQL connection check. It uses Mongoose and a cached connection promise so repeated calls do not create duplicate connection attempts.

If no Mongo URI is configured, the backend logs:

```text
MongoDB not configured. Continuing with SQL fallback.
```

If the connection fails, the backend logs the error and continues running.

Example local configuration:

```env
MONGO_URI=mongodb://localhost:27017/realestate
MONGO_CONNECT_TIMEOUT_MS=2500
```

## PropertyViewLog

Model file:

- `backend/models/mongo/PropertyViewLog.js`

Collection:

- `property_view_logs`

Purpose:

- Store property view events in MongoDB.
- Support Top Properties reporting from Mongo when MongoDB is available.
- Avoid relying only on a SQL counter for view analytics.

Fields:

- `property_id`
- `user_id`
- `ip_address`
- `user_agent`
- `source`
- `viewed_at`

Indexes:

- `property_id`
- `user_id`
- `viewed_at`
- compound index on `{ property_id: 1, viewed_at: -1 }`

Write path:

- `POST /api/properties/:id/track-view`
- `backend/services/propertyService.js`
- `backend/services/propertyViewLogService.js`

The endpoint still increments the SQL property view count, then attempts to write a Mongo `PropertyViewLog`. If MongoDB is unavailable or the write fails, the request continues safely.

## ChatMessageArchive

Model file:

- `backend/models/mongo/ChatMessageArchive.js`

Collection:

- `chat_message_archives`

Purpose:

- Store older chat messages archived from MySQL.
- Keep recent operational messages in SQL while preserving long-term message history in MongoDB.

Fields:

- `message_id`
- `thread_id`
- `property_id`
- `buyer_id`
- `seller_id`
- `sender_id`
- `body`
- `attachment_file_id`
- `is_edited`
- `edited_at`
- `read_at`
- `created_at`
- `archived_at`

Indexes:

- unique/indexed `message_id`
- `thread_id`
- `property_id`
- `buyer_id`
- `seller_id`
- `sender_id`
- `created_at`
- `archived_at`
- compound index on `{ thread_id: 1, created_at: 1 }`

## AuditLogArchive

Model file:

- `backend/models/mongo/AuditLogArchive.js`

Collection:

- `audit_log_archives`

Purpose:

- Store older audit logs archived from MySQL.
- Preserve historical audit data without keeping all long-term records in SQL.

Fields:

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

Indexes:

- unique/indexed `audit_log_id`
- `user_id`
- `action`
- `entity`
- `entity_id`
- `created_at`
- `archived_at`
- compound index on `{ entity: 1, entity_id: 1, created_at: -1 }`

`old_value` and `new_value` use mixed Mongo values. The archiver attempts to parse JSON strings before storing them.

## Mongo Archiver Job

Job file:

- `backend/jobs/mongoArchiver.job.js`

Startup:

- `startMongoArchiver()` is called from `backend/server.js`.
- The job only starts when `MONGO_ARCHIVE_ENABLED=true`.
- The job uses `node-cron`.

Environment variables:

```env
MONGO_ARCHIVE_ENABLED=true
MONGO_ARCHIVE_CRON=0 3 * * *
MONGO_ARCHIVE_BATCH_SIZE=500
MONGO_MESSAGE_ARCHIVE_DAYS=90
MONGO_AUDIT_ARCHIVE_DAYS=180
```

Defaults:

- `MONGO_ARCHIVE_CRON`: `0 3 * * *`
- `MONGO_ARCHIVE_BATCH_SIZE`: `500`
- `MONGO_MESSAGE_ARCHIVE_DAYS`: `90`
- `MONGO_AUDIT_ARCHIVE_DAYS`: `180`

Behavior:

1. Check that MongoDB is connected with `isMongoAvailable()`.
2. Archive old rows from SQL `messages` into `chat_message_archives`.
3. Archive old rows from SQL `audit_logs` into `audit_log_archives`.
4. Use Mongo `bulkWrite` with upserts so repeated runs do not duplicate archived documents.
5. Delete archived SQL rows only after Mongo write succeeds.
6. Log archive counts or failures.

The job validates the cron expression before scheduling. It also prevents overlapping archive runs.

## Top Properties Report

Report file:

- `backend/services/reportService.js`

Report endpoint:

- `GET /api/reports/top-properties`
- `GET /api/reports/top-properties/export`

When MongoDB is available, Top Properties uses `PropertyViewLog` first:

1. Aggregate `property_view_logs` by `property_id`.
2. Filter by `viewed_at` using the requested date range.
3. Sort properties by Mongo view count.
4. Load matching property details, favorites, and offer counts from SQL.
5. Return report rows with `parameters.source = "mongo"`.

If MongoDB is not available, the report falls back to SQL:

- SQL `property_view_logs` table if present.
- Otherwise `properties.views_count`.
- Otherwise zero view counts.

This keeps the report functional even when MongoDB is not configured.

## Operational Notes

MongoDB is optional for local development, but required to fully satisfy the NoSQL/reporting behavior.

To verify Mongo collections locally:

```bash
mongosh
use realestate
show collections
db.property_view_logs.find().pretty()
db.chat_message_archives.find().pretty()
db.audit_log_archives.find().pretty()
```

To create a `PropertyViewLog`, start the backend with Mongo configured and call:

```http
POST /api/properties/:id/track-view
```

Then check:

```javascript
db.property_view_logs.find().pretty()
```

## Summary

The repository now implements the Fadil NoSQL scope with a Mongoose connection, three Mongo collections, property view tracking, a cron-based Mongo archiver, and Mongo-backed Top Properties reporting with SQL fallback.

---

## Redis (Blert)

The Redis layer is opt-in. When `REDIS_ENABLED=false` (default in dev) every
helper in `backend/services/cache.service.js` and `backend/config/redis.js`
returns a no-op result, so single-instance development works without a Redis
process. When `REDIS_ENABLED=true` we expect a real Redis available at
`REDIS_URL` (default `redis://localhost:6379`).

### Key patterns

| Key | Value | TTL | Set by |
|---|---|---|---|
| `realestate:revoked:{tokenHash}` | `"1"` | matches refresh token expiry (~7d) | `auth.service.logout`, `refresh` |
| `realestate:ratelimit:{scope}:{userOrIp}` | counter | 60s | `middleware/redisRateLimit.middleware.js` |
| `realestate:search:{queryHash}` | JSON result page | 60s | `services/search.service.js` |
| `realestate:presence:{userId}` | `"1"` | 60s, refreshed on `presence:ping` | `sockets/presence.events.js` |

All Blert helpers prefix keys with `${env.redis.prefix}:` via
`redis.buildKey()`.

### Refresh-token revocation (B29)

`POST /api/auth/refresh` checks the revoked set BEFORE hitting MySQL. If the
hash is present, we return 401 immediately. On every successful rotation we
also push the just-used refresh token onto the revoked set, so it can't be
replayed even if the row is still active in the DB.

### Rate limiter (B30)

`middleware/redisRateLimit.middleware.js` exposes a Redis-backed limiter that
falls back to the in-process `express-rate-limit` when Redis is off. This
lets a multi-instance deployment share a single counter without losing
single-instance development ergonomics.

### Search cache (B49)

Universal search results are cached for 60 seconds per
`{user_id, query, entities, limit}` tuple. A second identical request from the
same browser within that window hits Redis instead of MySQL — useful for the
debounced SearchBar component which fires on every keystroke.

### Presence (B33)

When a socket connects we `SET realestate:presence:{userId} 1 EX 60` and
broadcast `presence:online` to the admin room. The client sends `presence:ping`
every 30 seconds to refresh the TTL. On disconnect (with no other active
sockets for the user) we DEL the key and broadcast `presence:offline`.

### Cache disabled mode

Because Redis is optional, every helper in `cache.service.js` returns `null` /
`false` when the client isn't connected. Callers must treat the cache as
advisory — the source of truth is always MySQL (for refresh tokens) or the
live socket adapter (for presence). This way feature code works whether
`REDIS_ENABLED=true` or not, with the only observable difference being a small
amount of duplicated work under load.

# Socket.IO Event Catalogue

Real-time transport for the RealEstate platform. The server runs Socket.IO over
the same HTTP server as the REST API.

## Connecting

```js
import { io } from "socket.io-client";

const socket = io("http://localhost:5000", {
  transports: ["websocket"],
  auth: { token: accessToken }, // JWT access token from /api/auth/login
});
```

The server runs a `io.use()` middleware that verifies the token:

- Valid token → `socket.user = { id, email, roles, role, permissions }`; the
  socket auto-joins `user:{id}` and (for Admins) `admin`.
- Missing or expired token → connection refused with `Access denied`.

If your access token expires, run the silent refresh first (`POST /api/auth/refresh`)
and reconnect; the socket layer reads the access token at handshake time.

## Rooms

| Room | Members | Used for |
|---|---|---|
| `user:{id}` | every connection for that user | direct notifications, session:revoked |
| `admin` | every Admin connection | audit:critical, presence broadcasts |
| `thread:{id}` | members of a chat thread (joined on demand) | chat messages, typing |
| `property:{id}` | watchers (joined on demand) | live property updates |

## Server-emitted events

| Event | Payload | Room | Owner |
|---|---|---|---|
| `notification:new` | `{ id, type, title, message, link, created_at }` | `user:{id}` | Blert |
| `notification:read` | `{ id }` | `user:{id}` | Blert |
| `session:revoked` | `{ reason }` | `user:{id}` | Blert |
| `presence:online` | `{ user_id }` | `admin` | Blert |
| `presence:offline` | `{ user_id, last_seen }` | `admin` | Blert |
| `audit:critical` | `{ action, entity, entity_id }` | `admin` | Blert |
| `message:new` | `{ id, thread_id, sender_id, body, created_at, attachment? }` | `thread:{id}` | Fadil |
| `message:read` | `{ messageId, readBy, readAt }` | `thread:{id}` | Fadil |
| `thread:typing` | `{ thread_id, user_id, is_typing }` | `thread:{id}` | Fadil |
| `thread:updated` | `{ thread_id, last_message_at, unread_count }` | `user:{id}` | Fadil |
| `offer:new` / `accepted` / `rejected` / `countered` | `{ offer }` etc. | `user:{seller_id}` / `user:{buyer_id}` | Fadil |
| `viewing:scheduled` / `confirmed` / `cancelled` | `{ viewing }` etc. | `user:{...}` | Fadil |
| `property:updated` | `{ property_id, fields_changed[] }` | `property:{id}` | Fadil |

## Client-emitted events

| Event | Payload | Owner |
|---|---|---|
| `thread:join` | `{ thread_id }` | UI (Lis) → server (Fadil) |
| `thread:leave` | `{ thread_id }` | Lis / Fadil |
| `thread:typing` | `{ thread_id }` | Lis / Fadil |
| `property:watch` | `{ property_id }` | Lis / Fadil |
| `property:unwatch` | `{ property_id }` | Lis / Fadil |
| `presence:ping` | `{}` | Lis emits every 30s; refreshes the Redis presence TTL |

## Session revocation flow (B33)

1. User clicks "Logout all sessions" → `POST /api/auth/logout-all`
2. `auth.service.logoutAll(userId)` revokes every active refresh token in MySQL,
   then calls `blertSockets.emitSessionRevoked(userId)` to broadcast
   `session:revoked` to **every active socket** in `user:{id}`.
3. Other devices' frontend listens for `session:revoked` and triggers their
   client-side logout (`clearTokens()` + redirect to `/login`).

## Versioning

Any change to an event name or payload shape requires a PR labelled
`socket-contract` and approval from both the front-end and back-end owners
listed above. This document is the source of truth.

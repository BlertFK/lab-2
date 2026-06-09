// B49: Universal search across properties, users, viewings, offers, messages.
// - Permission-scoped: Buyer only sees public properties; messaging/offers/
//   viewings are scoped to records the caller is part of.
// - Per-entity LIKE / FULLTEXT searches dispatched in parallel.
// - Optional Redis cache (60s) keyed by user-id + query hash, so repeated
//   searches across the same logged-in session hit Redis.

const crypto = require("crypto");
const db = require("../config/db");
const cache = require("./cache.service");

const ALL_ENTITIES = ["properties", "users", "viewings", "offers", "messages"];
const PUBLIC_ENTITIES = ["properties"];

function isAdmin(user) {
  return (user?.roles || []).some((r) => String(r).toLowerCase() === "admin")
      || (user?.role && String(user.role).toLowerCase() === "admin");
}

function hashQuery(parts) {
  return crypto.createHash("sha1").update(JSON.stringify(parts)).digest("hex").slice(0, 16);
}

async function searchProperties(q, { limit }) {
  const term = `%${q}%`;
  const [rows] = await db.query(
    `SELECT id, title, slug, price, currency, status, location_id, seller_id, created_at
     FROM properties
     WHERE (title LIKE ? OR description LIKE ? OR slug LIKE ?)
       AND status IN ('available','reserved','draft')
     ORDER BY created_at DESC
     LIMIT ?`,
    [term, term, term, limit]
  );
  return rows.map((r) => ({
    entity: "properties",
    id: r.id,
    title: r.title,
    subtitle: `${r.status} · ${r.currency} ${Number(r.price).toLocaleString()}`,
    link: `/property-details?id=${r.id}`,
    raw: r,
  }));
}

async function searchUsers(q, { limit }) {
  const term = `%${q}%`;
  const [rows] = await db.query(
    `SELECT id, first_name, last_name, email, is_active
     FROM users
     WHERE (email LIKE ? OR first_name LIKE ? OR last_name LIKE ? OR name LIKE ?)
     ORDER BY id DESC
     LIMIT ?`,
    [term, term, term, term, limit]
  );
  return rows.map((r) => ({
    entity: "users",
    id: r.id,
    title: `${r.first_name || ""} ${r.last_name || ""}`.trim() || r.email,
    subtitle: r.email + (r.is_active ? "" : " · inactive"),
    link: `/admin/users/${r.id}`,
    raw: r,
  }));
}

async function searchViewings(q, { limit, userId }) {
  const term = `%${q}%`;
  const [rows] = await db.query(
    `SELECT v.id, v.scheduled_at, v.status, p.title AS property_title
     FROM viewings v
     LEFT JOIN properties p ON p.id = v.property_id
     WHERE (p.title LIKE ? OR v.notes LIKE ? OR v.status LIKE ?)
       AND (? IS NULL OR v.buyer_id = ? OR v.seller_id = ?)
     ORDER BY v.scheduled_at DESC
     LIMIT ?`,
    [term, term, term, userId || null, userId, userId, limit]
  );
  return rows.map((r) => ({
    entity: "viewings",
    id: r.id,
    title: r.property_title || `Viewing #${r.id}`,
    subtitle: `${r.status} · ${new Date(r.scheduled_at).toLocaleString("en-GB")}`,
    link: `/viewings/${r.id}`,
    raw: r,
  }));
}

async function searchOffers(q, { limit, userId }) {
  const term = `%${q}%`;
  const [rows] = await db.query(
    `SELECT o.id, o.amount, o.currency, o.status, p.title AS property_title
     FROM offers o
     LEFT JOIN properties p ON p.id = o.property_id
     WHERE (p.title LIKE ? OR o.message LIKE ? OR o.status LIKE ?)
       AND (? IS NULL OR o.buyer_id = ? OR o.seller_id = ?)
     ORDER BY o.created_at DESC
     LIMIT ?`,
    [term, term, term, userId || null, userId, userId, limit]
  );
  return rows.map((r) => ({
    entity: "offers",
    id: r.id,
    title: r.property_title || `Offer #${r.id}`,
    subtitle: `${r.status} · ${r.currency} ${Number(r.amount).toLocaleString()}`,
    link: `/offers/${r.id}`,
    raw: r,
  }));
}

async function searchMessages(q, { limit, userId }) {
  const term = `%${q}%`;
  const [rows] = await db.query(
    `SELECT m.id, m.thread_id, m.body, m.created_at, t.buyer_id, t.seller_id
     FROM messages m
     JOIN message_threads t ON t.id = m.thread_id
     WHERE m.body LIKE ?
       AND (? IS NULL OR t.buyer_id = ? OR t.seller_id = ?)
     ORDER BY m.created_at DESC
     LIMIT ?`,
    [term, userId || null, userId, userId, limit]
  );
  return rows.map((r) => ({
    entity: "messages",
    id: r.id,
    title: r.body.length > 60 ? r.body.slice(0, 60) + "…" : r.body,
    subtitle: `Thread #${r.thread_id} · ${new Date(r.created_at).toLocaleString("en-GB")}`,
    link: `/threads/${r.thread_id}`,
    raw: r,
  }));
}

const DISPATCH = {
  properties: searchProperties,
  users: searchUsers,
  viewings: searchViewings,
  offers: searchOffers,
  messages: searchMessages,
};

async function search({ q, entities, limit = 10 }, user) {
  if (!q || q.trim().length < 2) {
    return { query: q, results: {}, total: 0, cached: false };
  }

  const requested = entities && entities.length ? entities : ALL_ENTITIES;
  // Permission scoping: non-admins drop users search
  const allowed = isAdmin(user)
    ? requested
    : requested.filter((e) => e !== "users" || (user?.permissions || []).includes("users.view"));

  // Public users (no JWT — only properties)
  const finalList = user ? allowed : allowed.filter((e) => PUBLIC_ENTITIES.includes(e));

  const userId = user?.id || null;
  const key = `search:${hashQuery({ q, finalList, userId, limit })}`;

  const cached = await cache.cacheGet(key);
  if (cached) return { ...cached, cached: true };

  const tasks = finalList.map((entity) =>
    DISPATCH[entity]
      ? DISPATCH[entity](q.trim(), { limit, userId })
          .then((rows) => [entity, rows])
          .catch(() => [entity, []])
      : Promise.resolve([entity, []])
  );

  const settled = await Promise.all(tasks);
  const results = {};
  let total = 0;
  for (const [entity, rows] of settled) {
    results[entity] = rows;
    total += rows.length;
  }

  const payload = { query: q, entities: finalList, results, total };
  await cache.cacheSet(key, payload, 60);
  return { ...payload, cached: false };
}

module.exports = { search, ALL_ENTITIES };

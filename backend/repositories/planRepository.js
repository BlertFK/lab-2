const db = require("../config/db");

const listActivePlans = async () => {
  const [rows] = await db.query(
    `SELECT id, name, slug, price, duration_days, max_listings, max_featured, features, is_active
     FROM plans
     WHERE is_active = 1
     ORDER BY price ASC, id ASC`
  );

  return rows;
};

const findPlanById = async (id) => {
  const [rows] = await db.query("SELECT * FROM plans WHERE id = ?", [id]);
  return rows[0] || null;
};

const findPlanBySlug = async (slug) => {
  const [rows] = await db.query("SELECT * FROM plans WHERE slug = ?", [slug]);
  return rows[0] || null;
};

const findSubscriptionByUserId = async (userId) => {
  const [rows] = await db.query(
    `SELECT s.*, p.name AS plan_name, p.slug AS plan_slug, p.max_listings, p.max_featured, p.price
     FROM subscriptions s
     INNER JOIN plans p ON p.id = s.plan_id
     WHERE s.user_id = ?`,
    [userId]
  );

  return rows[0] || null;
};

const upsertSubscription = async ({ user_id, plan_id, expires_at, auto_renew = 0 }) => {
  await db.query(
    `INSERT INTO subscriptions (user_id, plan_id, started_at, expires_at, status, auto_renew)
     VALUES (?, ?, NOW(), ?, 'active', ?)
     ON DUPLICATE KEY UPDATE
       plan_id = VALUES(plan_id),
       started_at = NOW(),
       expires_at = VALUES(expires_at),
       status = 'active',
       auto_renew = VALUES(auto_renew)`,
    [user_id, plan_id, expires_at, auto_renew ? 1 : 0]
  );

  return findSubscriptionByUserId(user_id);
};

const countListingsForUser = async (userId) => {
  const [rows] = await db.query(
    "SELECT COUNT(*) AS count FROM properties WHERE seller_id = ?",
    [userId]
  );

  return Number(rows[0]?.count || 0);
};

module.exports = {
  listActivePlans,
  findPlanById,
  findPlanBySlug,
  findSubscriptionByUserId,
  upsertSubscription,
  countListingsForUser,
};

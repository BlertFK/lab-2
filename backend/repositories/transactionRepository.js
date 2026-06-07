const db = require("../config/db");

const create = async (transaction) => {
  const [result] = await db.query(
    `INSERT INTO transactions
      (offer_id, property_id, buyer_id, seller_id, agent_id, amount, commission_amount, status, payment_method, completed_at, created_by, updated_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      transaction.offer_id || null,
      transaction.property_id,
      transaction.buyer_id,
      transaction.seller_id,
      transaction.agent_id || null,
      transaction.amount,
      transaction.commission_amount || 0,
      transaction.status || "pending",
      transaction.payment_method || null,
      transaction.completed_at || null,
      transaction.created_by,
      transaction.updated_by,
    ]
  );

  return result.insertId;
};

const findById = async (id) => {
  const [rows] = await db.query(
    `SELECT t.*, p.title AS property_title, buyer.name AS buyer_name, seller.name AS seller_name
     FROM transactions t
     INNER JOIN properties p ON p.id = t.property_id
     INNER JOIN users buyer ON buyer.id = t.buyer_id
     INNER JOIN users seller ON seller.id = t.seller_id
     WHERE t.id = ?`,
    [id]
  );

  return rows[0] || null;
};

const findByOfferId = async (offerId) => {
  const [rows] = await db.query("SELECT * FROM transactions WHERE offer_id = ?", [offerId]);
  return rows[0] || null;
};

const listForUser = async (user) => {
  const params = [];
  let where = "1=1";

  if (user.role === "buyer") {
    where = "t.buyer_id = ?";
    params.push(user.id);
  } else if (user.role === "seller") {
    where = "t.seller_id = ?";
    params.push(user.id);
  }

  const [rows] = await db.query(
    `SELECT t.*, p.title AS property_title, buyer.name AS buyer_name, seller.name AS seller_name
     FROM transactions t
     INNER JOIN properties p ON p.id = t.property_id
     INNER JOIN users buyer ON buyer.id = t.buyer_id
     INNER JOIN users seller ON seller.id = t.seller_id
     WHERE ${where}
     ORDER BY t.created_at DESC`,
    params
  );

  return rows;
};

const updateStatus = async (id, changes) => {
  const [result] = await db.query(
    `UPDATE transactions
     SET status = ?, payment_method = COALESCE(?, payment_method), completed_at = ?, updated_by = ?
     WHERE id = ?`,
    [
      changes.status,
      changes.payment_method || null,
      changes.completed_at || null,
      changes.updated_by,
      id,
    ]
  );

  return result.affectedRows;
};

module.exports = {
  create,
  findById,
  findByOfferId,
  listForUser,
  updateStatus,
};


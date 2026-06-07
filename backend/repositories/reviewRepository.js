const db = require("../config/db");

const create = async (review) => {
  const [result] = await db.query(
    `INSERT INTO reviews
      (property_id, user_id, transaction_id, rating, title, comment, is_verified, is_hidden)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      review.property_id,
      review.user_id,
      review.transaction_id || null,
      review.rating,
      review.title || null,
      review.comment,
      review.is_verified ? 1 : 0,
      review.is_hidden ? 1 : 0,
    ]
  );

  return result.insertId;
};

const findById = async (id) => {
  const [rows] = await db.query(
    `SELECT r.*, u.name AS user_name
     FROM reviews r
     INNER JOIN users u ON u.id = r.user_id
     WHERE r.id = ?`,
    [id]
  );

  return rows[0] || null;
};

const listByProperty = async (propertyId, includeHidden = false) => {
  const [rows] = await db.query(
    `SELECT r.*, u.name AS user_name
     FROM reviews r
     INNER JOIN users u ON u.id = r.user_id
     WHERE r.property_id = ? ${includeHidden ? "" : "AND r.is_hidden = 0"}
     ORDER BY r.created_at DESC`,
    [propertyId]
  );

  return rows;
};

const findCompletedTransaction = async (propertyId, userId) => {
  const [rows] = await db.query(
    `SELECT id
     FROM transactions
     WHERE property_id = ? AND buyer_id = ? AND status = 'completed'
     ORDER BY completed_at DESC, id DESC
     LIMIT 1`,
    [propertyId, userId]
  );

  return rows[0] || null;
};

const setHidden = async (id, isHidden) => {
  const [result] = await db.query(
    "UPDATE reviews SET is_hidden = ? WHERE id = ?",
    [isHidden ? 1 : 0, id]
  );

  return result.affectedRows;
};

module.exports = {
  create,
  findById,
  listByProperty,
  findCompletedTransaction,
  setHidden,
};


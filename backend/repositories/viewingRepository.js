const db = require("../config/db");

const create = async (viewing) => {
  const [result] = await db.query(
    `INSERT INTO viewings
      (property_id, buyer_id, seller_id, scheduled_at, duration_minutes, status, notes, created_by, updated_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      viewing.property_id,
      viewing.buyer_id,
      viewing.seller_id,
      viewing.scheduled_at,
      viewing.duration_minutes || 30,
      viewing.status || "requested",
      viewing.notes || null,
      viewing.created_by,
      viewing.updated_by,
    ]
  );

  return result.insertId;
};

const findById = async (id) => {
  const [rows] = await db.query(
    `SELECT v.*, p.title AS property_title, buyer.name AS buyer_name, seller.name AS seller_name
     FROM viewings v
     INNER JOIN properties p ON p.id = v.property_id
     INNER JOIN users buyer ON buyer.id = v.buyer_id
     INNER JOIN users seller ON seller.id = v.seller_id
     WHERE v.id = ?`,
    [id]
  );

  return rows[0] || null;
};

const listForUser = async (user) => {
  const params = [];
  let where = "1=1";

  if (user.role === "buyer") {
    where = "v.buyer_id = ?";
    params.push(user.id);
  } else if (user.role === "seller") {
    where = "v.seller_id = ?";
    params.push(user.id);
  }

  const [rows] = await db.query(
    `SELECT v.*, p.title AS property_title, buyer.name AS buyer_name, seller.name AS seller_name
     FROM viewings v
     INNER JOIN properties p ON p.id = v.property_id
     INNER JOIN users buyer ON buyer.id = v.buyer_id
     INNER JOIN users seller ON seller.id = v.seller_id
     WHERE ${where}
     ORDER BY v.scheduled_at DESC`,
    params
  );

  return rows;
};

const updateStatus = async (id, changes) => {
  const [result] = await db.query(
    `UPDATE viewings
     SET status = ?, cancelled_by = ?, cancelled_reason = ?, updated_by = ?
     WHERE id = ?`,
    [
      changes.status,
      changes.cancelled_by || null,
      changes.cancelled_reason || null,
      changes.updated_by,
      id,
    ]
  );

  return result.affectedRows;
};

module.exports = {
  create,
  findById,
  listForUser,
  updateStatus,
};


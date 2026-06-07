const db = require("../config/db");

const create = async (offer) => {
  const [result] = await db.query(
    `INSERT INTO offers
      (property_id, buyer_id, seller_id, amount, currency, message, status, counter_offer_id, expires_at, created_by, updated_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      offer.property_id,
      offer.buyer_id,
      offer.seller_id,
      offer.amount,
      offer.currency || "EUR",
      offer.message || null,
      offer.status || "pending",
      offer.counter_offer_id || null,
      offer.expires_at || null,
      offer.created_by,
      offer.updated_by,
    ]
  );

  return result.insertId;
};

const findById = async (id) => {
  const [rows] = await db.query(
    `SELECT o.*, p.title AS property_title, buyer.name AS buyer_name, seller.name AS seller_name
     FROM offers o
     INNER JOIN properties p ON p.id = o.property_id
     INNER JOIN users buyer ON buyer.id = o.buyer_id
     INNER JOIN users seller ON seller.id = o.seller_id
     WHERE o.id = ?`,
    [id]
  );

  return rows[0] || null;
};

const listForUser = async (user) => {
  const params = [];
  let where = "1=1";

  if (user.role === "buyer") {
    where = "o.buyer_id = ?";
    params.push(user.id);
  } else if (user.role === "seller") {
    where = "o.seller_id = ?";
    params.push(user.id);
  }

  const [rows] = await db.query(
    `SELECT o.*, p.title AS property_title, buyer.name AS buyer_name, seller.name AS seller_name
     FROM offers o
     INNER JOIN properties p ON p.id = o.property_id
     INNER JOIN users buyer ON buyer.id = o.buyer_id
     INNER JOIN users seller ON seller.id = o.seller_id
     WHERE ${where}
     ORDER BY o.created_at DESC`,
    params
  );

  return rows;
};

const updateStatus = async (id, status, updatedBy) => {
  const [result] = await db.query(
    "UPDATE offers SET status = ?, updated_by = ? WHERE id = ?",
    [status, updatedBy, id]
  );

  return result.affectedRows;
};

module.exports = {
  create,
  findById,
  listForUser,
  updateStatus,
};


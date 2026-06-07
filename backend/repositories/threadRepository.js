const db = require("../config/db");

const findByParticipants = async (buyerId, sellerId, propertyId, executor = db) => {
  const params = [buyerId, sellerId];
  let propertyClause = "property_id IS NULL";

  if (propertyId !== null && propertyId !== undefined) {
    propertyClause = "property_id = ?";
    params.push(propertyId);
  }

  const [rows] = await executor.query(
    `SELECT * FROM message_threads
     WHERE buyer_id = ? AND seller_id = ? AND ${propertyClause}
     LIMIT 1`,
    params
  );

  return rows[0] || null;
};

const findById = async (id, executor = db) => {
  const [rows] = await executor.query("SELECT * FROM message_threads WHERE id = ?", [id]);
  return rows[0] || null;
};

const create = async ({ property_id, buyer_id, seller_id }, executor = db) => {
  const [result] = await executor.query(
    `INSERT INTO message_threads (property_id, buyer_id, seller_id)
     VALUES (?, ?, ?)`,
    [property_id || null, buyer_id, seller_id]
  );

  return result.insertId;
};

const listForUser = async (user) => {
  const params = [];
  let where = "(mt.buyer_id = ? OR mt.seller_id = ?)";
  params.push(user.id, user.id);

  if (user.role === "admin") {
    where = "1=1";
    params.length = 0;
  }

  const [rows] = await db.query(
    `SELECT
       mt.id,
       mt.property_id,
       mt.buyer_id,
       mt.seller_id,
       mt.last_message_at,
       mt.buyer_unread_count,
       mt.seller_unread_count,
       CASE
         WHEN mt.buyer_id = ? THEN mt.buyer_unread_count
         WHEN mt.seller_id = ? THEN mt.seller_unread_count
         ELSE 0
       END AS unread_count,
       mt.is_archived,
       mt.created_at,
       mt.updated_at,
       p.title AS property_title,
       p.price AS property_price,
       p.location AS property_location,
       p.type AS property_type,
       p.status AS property_status,
       p.image_url AS property_image_url,
       buyer.name AS buyer_name,
       buyer.email AS buyer_email,
       seller.name AS seller_name,
       seller.email AS seller_email,
       CASE WHEN mt.buyer_id = ? THEN seller.id ELSE buyer.id END AS other_participant_id,
       CASE WHEN mt.buyer_id = ? THEN seller.name ELSE buyer.name END AS other_participant_name,
       CASE WHEN mt.buyer_id = ? THEN seller.email ELSE buyer.email END AS other_participant_email,
       CASE WHEN mt.buyer_id = ? THEN seller.role ELSE buyer.role END AS other_participant_role,
       lm.body AS last_message_body,
       lm.sender_id AS last_message_sender_id,
       lm.created_at AS last_message_created_at
     FROM message_threads mt
     LEFT JOIN properties p ON p.id = mt.property_id
     INNER JOIN users buyer ON buyer.id = mt.buyer_id
     INNER JOIN users seller ON seller.id = mt.seller_id
     LEFT JOIN messages lm ON lm.id = (
       SELECT m2.id
       FROM messages m2
       WHERE m2.thread_id = mt.id
       ORDER BY m2.created_at DESC, m2.id DESC
       LIMIT 1
     )
     WHERE ${where}
     ORDER BY COALESCE(mt.last_message_at, mt.created_at) DESC`,
    [user.id, user.id, user.id, user.id, user.id, user.id, ...params]
  );

  return rows;
};

const updateLastMessageAt = async (threadId, executor = db) => {
  await executor.query(
    "UPDATE message_threads SET last_message_at = NOW() WHERE id = ?",
    [threadId]
  );
};

const incrementUnreadForRecipient = async (thread, senderId, executor = db) => {
  if (thread.buyer_id === senderId) {
    await executor.query(
      "UPDATE message_threads SET seller_unread_count = seller_unread_count + 1 WHERE id = ?",
      [thread.id]
    );
    return;
  }

  await executor.query(
    "UPDATE message_threads SET buyer_unread_count = buyer_unread_count + 1 WHERE id = ?",
    [thread.id]
  );
};

const decrementUnreadForReader = async (thread, readerId, executor = db) => {
  if (thread.buyer_id === readerId) {
    await executor.query(
      "UPDATE message_threads SET buyer_unread_count = GREATEST(buyer_unread_count - 1, 0) WHERE id = ?",
      [thread.id]
    );
    return;
  }

  await executor.query(
    "UPDATE message_threads SET seller_unread_count = GREATEST(seller_unread_count - 1, 0) WHERE id = ?",
    [thread.id]
  );
};

module.exports = {
  findByParticipants,
  findById,
  create,
  listForUser,
  updateLastMessageAt,
  incrementUnreadForRecipient,
  decrementUnreadForReader,
};

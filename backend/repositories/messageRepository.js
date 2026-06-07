const db = require("../config/db");

const create = async ({ thread_id, sender_id, body, attachment_file_id }, executor = db) => {
  const [result] = await executor.query(
    `INSERT INTO messages (thread_id, sender_id, buyer_id, seller_id, property_id, message, body, attachment_file_id)
     SELECT id, ?, buyer_id, seller_id, property_id, ?, ?, ?
     FROM message_threads
     WHERE id = ?`,
    [sender_id, body, body, attachment_file_id || null, thread_id]
  );

  return result.insertId;
};

const findById = async (id, executor = db) => {
  const [rows] = await executor.query(
    `SELECT m.*, mt.buyer_id, mt.seller_id
     FROM messages m
     INNER JOIN message_threads mt ON mt.id = m.thread_id
     WHERE m.id = ?`,
    [id]
  );

  return rows[0] || null;
};

const findByThreadId = async (threadId) => {
  const [rows] = await db.query(
    `SELECT
       m.id,
       m.thread_id,
       m.sender_id,
       sender.name AS sender_name,
       sender.email AS sender_email,
       sender.role AS sender_role,
       m.body,
       m.attachment_file_id,
       m.is_edited,
       m.edited_at,
       m.read_at,
       m.created_at
     FROM messages m
     INNER JOIN users sender ON sender.id = m.sender_id
     WHERE m.thread_id = ?
     ORDER BY m.created_at ASC, m.id ASC`,
    [threadId]
  );

  return rows;
};

const markRead = async (id, readerId, executor = db) => {
  const [result] = await executor.query(
    `UPDATE messages
     SET read_at = NOW()
     WHERE id = ?
       AND sender_id <> ?
       AND read_at IS NULL`,
    [id, readerId]
  );

  return result.affectedRows;
};

module.exports = {
  create,
  findById,
  findByThreadId,
  markRead,
};

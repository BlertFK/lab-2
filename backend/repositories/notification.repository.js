const BaseRepository = require("./base.repository");
const db = require("../config/db");

class NotificationRepository extends BaseRepository {
  constructor() {
    super("notifications");
  }

  async listForUser({ userId, unreadOnly = false, limit, offset }) {
    const where = ["user_id = ?"];
    const params = [userId];
    if (unreadOnly) where.push("is_read = 0");

    const [rows] = await db.query(
      `SELECT SQL_CALC_FOUND_ROWS *
       FROM notifications
       WHERE ${where.join(" AND ")}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    const [[{ total }]] = await db.query(`SELECT FOUND_ROWS() AS total`);
    const [[{ unread }]] = await db.query(
      `SELECT COUNT(*) AS unread FROM notifications WHERE user_id = ? AND is_read = 0`,
      [userId]
    );
    return {
      data: rows.map((n) => ({ ...n, is_read: !!n.is_read })),
      total,
      unread,
    };
  }

  async markRead(id, userId) {
    const [result] = await db.query(
      `UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`,
      [id, userId]
    );
    return result.affectedRows > 0;
  }

  async markAllRead(userId) {
    const [result] = await db.query(
      `UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0`,
      [userId]
    );
    return result.affectedRows;
  }
}

module.exports = new NotificationRepository();

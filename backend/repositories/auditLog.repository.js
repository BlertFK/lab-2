const BaseRepository = require("./base.repository");
const db = require("../config/db");

class AuditLogRepository extends BaseRepository {
  constructor() {
    super("audit_logs");
  }

  async log({ userId = null, action, entity, entityId = null, oldValue = null, newValue = null, ipAddress = null, userAgent = null }) {
    await db.query(
      `INSERT INTO audit_logs (user_id, action, entity, entity_id, old_value, new_value, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        action,
        entity,
        entityId,
        oldValue ? JSON.stringify(oldValue) : null,
        newValue ? JSON.stringify(newValue) : null,
        ipAddress,
        userAgent,
      ]
    );
  }

  async listPaginated({ userId, entity, action, dateFrom, dateTo, limit, offset }) {
    const where = [];
    const params = [];
    if (userId) { where.push("a.user_id = ?"); params.push(userId); }
    if (entity) { where.push("a.entity = ?"); params.push(entity); }
    if (action) { where.push("a.action = ?"); params.push(action); }
    if (dateFrom) { where.push("a.created_at >= ?"); params.push(dateFrom); }
    if (dateTo) { where.push("a.created_at <= ?"); params.push(dateTo); }
    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const [rows] = await db.query(
      `SELECT SQL_CALC_FOUND_ROWS a.*,
              u.email AS user_email,
              CONCAT_WS(' ', u.first_name, u.last_name) AS user_name
       FROM audit_logs a
       LEFT JOIN users u ON u.id = a.user_id
       ${whereSql}
       ORDER BY a.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    const [[{ total }]] = await db.query(`SELECT FOUND_ROWS() AS total`);
    return { data: rows, total };
  }

  async findByIdJoined(id) {
    const [rows] = await db.query(
      `SELECT a.*, u.email AS user_email,
              CONCAT_WS(' ', u.first_name, u.last_name) AS user_name
       FROM audit_logs a
       LEFT JOIN users u ON u.id = a.user_id
       WHERE a.id = ? LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  }
}

module.exports = new AuditLogRepository();

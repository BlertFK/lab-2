const BaseRepository = require("./base.repository");
const db = require("../config/db");

class RefreshTokenRepository extends BaseRepository {
  constructor() {
    super("refresh_tokens");
  }

  async findActiveByHash(tokenHash) {
    const [rows] = await db.query(
      `SELECT * FROM refresh_tokens
       WHERE token_hash = ? AND revoked_at IS NULL AND expires_at > NOW()
       LIMIT 1`,
      [tokenHash]
    );
    return rows[0] || null;
  }

  async revoke(tokenId, replacedBy = null) {
    await db.query(
      `UPDATE refresh_tokens
       SET revoked_at = CURRENT_TIMESTAMP, replaced_by = ?
       WHERE id = ? AND revoked_at IS NULL`,
      [replacedBy, tokenId]
    );
  }

  async revokeAllForUser(userId) {
    const [result] = await db.query(
      `UPDATE refresh_tokens
       SET revoked_at = CURRENT_TIMESTAMP
       WHERE user_id = ? AND revoked_at IS NULL`,
      [userId]
    );
    return result.affectedRows;
  }

  async deleteExpired() {
    const [result] = await db.query(
      `DELETE FROM refresh_tokens WHERE expires_at < (NOW() - INTERVAL 1 DAY)`
    );
    return result.affectedRows;
  }

  async listSessionsForUser(userId) {
    const [rows] = await db.query(
      `SELECT id, user_agent, ip_address, expires_at, revoked_at, created_at
       FROM refresh_tokens
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [userId]
    );
    return rows;
  }
}

module.exports = new RefreshTokenRepository();

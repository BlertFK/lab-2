const BaseRepository = require("./base.repository");
const db = require("../config/db");

class SettingsRepository extends BaseRepository {
  constructor() {
    super("settings");
  }

  async findByKey(key) {
    const [rows] = await db.query(
      "SELECT * FROM settings WHERE `key` = ? LIMIT 1",
      [key]
    );
    return rows[0] || null;
  }

  async listAll({ publicOnly = false } = {}) {
    const where = publicOnly ? "WHERE is_public = 1" : "";
    const [rows] = await db.query(
      `SELECT * FROM settings ${where} ORDER BY \`key\` ASC`
    );
    return rows.map((s) => ({ ...s, is_public: !!s.is_public }));
  }

  async upsert(key, value, { type, description, isPublic, updatedBy } = {}) {
    const existing = await this.findByKey(key);
    if (existing) {
      await db.query(
        `UPDATE settings
         SET value = ?, type = COALESCE(?, type), description = COALESCE(?, description),
             is_public = COALESCE(?, is_public), updated_by = ?
         WHERE \`key\` = ?`,
        [value, type, description, typeof isPublic === "boolean" ? (isPublic ? 1 : 0) : null, updatedBy, key]
      );
    } else {
      await db.query(
        `INSERT INTO settings (\`key\`, value, type, description, is_public, updated_by)
         VALUES (?, ?, COALESCE(?, 'string'), ?, COALESCE(?, 0), ?)`,
        [key, value, type, description, typeof isPublic === "boolean" ? (isPublic ? 1 : 0) : null, updatedBy]
      );
    }
    return this.findByKey(key);
  }
}

module.exports = new SettingsRepository();

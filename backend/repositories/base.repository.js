const db = require("../config/db");

class BaseRepository {
  constructor(tableName, primaryKey = "id") {
    this.table = tableName;
    this.pk = primaryKey;
  }

  async findById(id, columns = "*") {
    const [rows] = await db.query(
      `SELECT ${columns} FROM \`${this.table}\` WHERE \`${this.pk}\` = ? LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  }

  async findOne(where = {}, columns = "*") {
    const { sql, params } = this._whereClause(where);
    const [rows] = await db.query(
      `SELECT ${columns} FROM \`${this.table}\` ${sql} LIMIT 1`,
      params
    );
    return rows[0] || null;
  }

  async findAll({ where = {}, orderBy, limit, offset = 0, columns = "*" } = {}) {
    const { sql: whereSql, params } = this._whereClause(where);
    let sql = `SELECT ${columns} FROM \`${this.table}\` ${whereSql}`;
    if (orderBy) sql += ` ORDER BY \`${orderBy.field}\` ${orderBy.dir}`;
    if (limit) {
      sql += ` LIMIT ? OFFSET ?`;
      params.push(limit, offset);
    }
    const [rows] = await db.query(sql, params);
    return rows;
  }

  async count(where = {}) {
    const { sql, params } = this._whereClause(where);
    const [rows] = await db.query(
      `SELECT COUNT(*) AS total FROM \`${this.table}\` ${sql}`,
      params
    );
    return rows[0].total;
  }

  async create(data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map(() => "?").join(", ");
    const cols = keys.map((k) => `\`${k}\``).join(", ");
    const [result] = await db.query(
      `INSERT INTO \`${this.table}\` (${cols}) VALUES (${placeholders})`,
      values
    );
    return { id: result.insertId, ...data };
  }

  async update(id, data) {
    const keys = Object.keys(data);
    if (!keys.length) return this.findById(id);
    const setClause = keys.map((k) => `\`${k}\` = ?`).join(", ");
    const values = [...Object.values(data), id];
    await db.query(
      `UPDATE \`${this.table}\` SET ${setClause} WHERE \`${this.pk}\` = ?`,
      values
    );
    return this.findById(id);
  }

  async delete(id) {
    const [result] = await db.query(
      `DELETE FROM \`${this.table}\` WHERE \`${this.pk}\` = ?`,
      [id]
    );
    return result.affectedRows > 0;
  }

  _whereClause(where = {}) {
    const keys = Object.keys(where);
    if (!keys.length) return { sql: "", params: [] };
    const parts = [];
    const params = [];
    for (const key of keys) {
      const val = where[key];
      if (val === null) {
        parts.push(`\`${key}\` IS NULL`);
      } else if (Array.isArray(val)) {
        parts.push(`\`${key}\` IN (${val.map(() => "?").join(",")})`);
        params.push(...val);
      } else {
        parts.push(`\`${key}\` = ?`);
        params.push(val);
      }
    }
    return { sql: `WHERE ${parts.join(" AND ")}`, params };
  }

  async query(sql, params = []) {
    const [rows] = await db.query(sql, params);
    return rows;
  }
}

module.exports = BaseRepository;

const BaseRepository = require("./base.repository");
const db = require("../config/db");

class PermissionRepository extends BaseRepository {
  constructor() {
    super("permissions");
  }

  async listAll() {
    const [rows] = await db.query(
      `SELECT id, name, description, resource FROM permissions ORDER BY resource, name`
    );
    return rows;
  }

  async findByName(name) {
    const [rows] = await db.query(`SELECT * FROM permissions WHERE name = ? LIMIT 1`, [name]);
    return rows[0] || null;
  }

  async groupedByResource() {
    const all = await this.listAll();
    return all.reduce((acc, p) => {
      (acc[p.resource] = acc[p.resource] || []).push(p);
      return acc;
    }, {});
  }
}

module.exports = new PermissionRepository();

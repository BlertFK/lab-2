const BaseRepository = require("./base.repository");
const db = require("../config/db");

class RoleRepository extends BaseRepository {
  constructor() {
    super("roles");
  }

  async findByName(name) {
    const [rows] = await db.query(`SELECT * FROM roles WHERE name = ? LIMIT 1`, [name]);
    return rows[0] || null;
  }

  async listAllWithCounts() {
    const [rows] = await db.query(
      `SELECT r.*,
              (SELECT COUNT(*) FROM user_roles ur WHERE ur.role_id = r.id) AS users_count,
              (SELECT COUNT(*) FROM role_permissions rp WHERE rp.role_id = r.id) AS permissions_count
       FROM roles r
       ORDER BY r.is_system DESC, r.name ASC`
    );
    return rows.map((r) => ({ ...r, is_system: !!r.is_system }));
  }

  async findPermissionsForRole(roleId) {
    const [rows] = await db.query(
      `SELECT p.id, p.name, p.description, p.resource
       FROM permissions p
       JOIN role_permissions rp ON rp.permission_id = p.id
       WHERE rp.role_id = ?
       ORDER BY p.resource, p.name`,
      [roleId]
    );
    return rows;
  }

  async assignPermission(roleId, permissionId) {
    await db.query(
      `INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)`,
      [roleId, permissionId]
    );
  }

  async revokePermission(roleId, permissionId) {
    await db.query(
      `DELETE FROM role_permissions WHERE role_id = ? AND permission_id = ?`,
      [roleId, permissionId]
    );
  }

  async assignToUser(userId, roleId, assignedBy = null) {
    await db.query(
      `INSERT IGNORE INTO user_roles (user_id, role_id, assigned_by) VALUES (?, ?, ?)`,
      [userId, roleId, assignedBy]
    );
  }

  async revokeFromUser(userId, roleId) {
    await db.query(
      `DELETE FROM user_roles WHERE user_id = ? AND role_id = ?`,
      [userId, roleId]
    );
  }
}

module.exports = new RoleRepository();

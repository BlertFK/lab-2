const BaseRepository = require("./base.repository");
const db = require("../config/db");

class UserRepository extends BaseRepository {
  constructor() {
    super("users");
  }

  async findByEmail(email) {
    const [rows] = await db.query(
      `SELECT * FROM users WHERE email = ? LIMIT 1`,
      [email]
    );
    return rows[0] || null;
  }

  async findActiveById(id) {
    const [rows] = await db.query(
      `SELECT * FROM users WHERE id = ? AND is_active = 1 LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  }

  async findRolesForUser(userId) {
    const [rows] = await db.query(
      `SELECT r.id, r.name, r.description, r.is_system
       FROM roles r
       JOIN user_roles ur ON ur.role_id = r.id
       WHERE ur.user_id = ?`,
      [userId]
    );
    return rows;
  }

  async findPermissionsForUser(userId) {
    const [rows] = await db.query(
      `SELECT DISTINCT p.name
       FROM permissions p
       JOIN role_permissions rp ON rp.permission_id = p.id
       JOIN user_roles ur ON ur.role_id = rp.role_id
       WHERE ur.user_id = ?`,
      [userId]
    );
    return rows.map((r) => r.name);
  }

  async findUserWithRolesAndPermissions(userId) {
    const user = await this.findActiveById(userId);
    if (!user) return null;
    const [roles, permissions] = await Promise.all([
      this.findRolesForUser(userId),
      this.findPermissionsForUser(userId),
    ]);
    return { ...user, roles, permissions };
  }

  async touchLastLogin(userId) {
    await db.query(
      `UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [userId]
    );
  }

  async setPasswordHash(userId, passwordHash) {
    await db.query(
      `UPDATE users SET password_hash = ? WHERE id = ?`,
      [passwordHash, userId]
    );
  }

  async setActive(userId, isActive) {
    await db.query(
      `UPDATE users SET is_active = ? WHERE id = ?`,
      [isActive ? 1 : 0, userId]
    );
    return this.findById(userId);
  }

  async listPaginated({ search, role, isActive, limit, offset }) {
    const where = [];
    const params = [];
    if (search) {
      where.push(`(u.email LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?)`);
      const term = `%${search}%`;
      params.push(term, term, term);
    }
    if (typeof isActive === "boolean") {
      where.push(`u.is_active = ?`);
      params.push(isActive ? 1 : 0);
    }
    let joinRole = "";
    if (role) {
      joinRole = `JOIN user_roles ur ON ur.user_id = u.id JOIN roles r ON r.id = ur.role_id AND r.name = ?`;
      params.push(role);
    }
    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const [rows] = await db.query(
      `SELECT SQL_CALC_FOUND_ROWS u.id, u.first_name, u.last_name, u.email, u.phone,
              u.is_active, u.email_verified_at, u.last_login_at, u.created_at,
              GROUP_CONCAT(DISTINCT r2.name) AS roles
       FROM users u
       ${joinRole}
       LEFT JOIN user_roles ur2 ON ur2.user_id = u.id
       LEFT JOIN roles r2 ON r2.id = ur2.role_id
       ${whereSql}
       GROUP BY u.id
       ORDER BY u.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    const [[{ total }]] = await db.query(`SELECT FOUND_ROWS() AS total`);
    const data = rows.map((r) => ({
      ...r,
      is_active: !!r.is_active,
      roles: r.roles ? r.roles.split(",") : [],
    }));
    return { data, total };
  }
}

module.exports = new UserRepository();

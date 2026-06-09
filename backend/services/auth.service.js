const userRepo = require("../repositories/user.repository");
const roleRepo = require("../repositories/role.repository");
const refreshRepo = require("../repositories/refreshToken.repository");
const auditRepo = require("../repositories/auditLog.repository");
const passwordUtil = require("../utils/password.util");
const jwtUtil = require("../utils/jwt.util");
const { AuthError, ConflictError, NotFoundError } = require("../utils/errors.util");
const logger = require("../config/logger");

function publicUserShape(user, roles = [], permissions = []) {
  const roleNames = roles.map((r) => (typeof r === "string" ? r : r.name));
  // Legacy `role` field (lowercase primary role) is kept so existing frontend
  // checks like `user.role === "admin"` keep routing to the right dashboard.
  const legacyRole = roleNames[0] ? String(roleNames[0]).toLowerCase() : null;
  return {
    id: user.id,
    first_name: user.first_name,
    last_name: user.last_name,
    name: [user.first_name, user.last_name].filter(Boolean).join(" ") || user.email,
    email: user.email,
    phone: user.phone,
    avatar_file_id: user.avatar_file_id,
    is_active: !!user.is_active,
    email_verified_at: user.email_verified_at,
    last_login_at: user.last_login_at,
    created_at: user.created_at,
    role: legacyRole,
    roles: roleNames,
    permissions,
  };
}

async function issueTokenPair(user, { userAgent, ipAddress } = {}) {
  const roles = await userRepo.findRolesForUser(user.id);
  const permissions = await userRepo.findPermissionsForUser(user.id);
  const roleNames = roles.map((r) => r.name);

  const payload = {
    sub: user.id,
    email: user.email,
    roles: roleNames,
    role: roleNames[0] || null, // legacy compat
    permissions,
  };

  const accessToken = jwtUtil.signAccess(payload);
  const refreshToken = jwtUtil.signRefresh({ sub: user.id });
  const tokenHash = jwtUtil.hashToken(refreshToken);

  await refreshRepo.create({
    user_id: user.id,
    token_hash: tokenHash,
    user_agent: userAgent ? userAgent.substring(0, 255) : null,
    ip_address: ipAddress ? ipAddress.substring(0, 45) : null,
    expires_at: jwtUtil.refreshExpiryDate(),
  });

  return {
    accessToken,
    refreshToken,
    user: publicUserShape(user, roleNames, permissions),
  };
}

async function register({ first_name, last_name, email, password, phone, role }, ctx = {}) {
  const existing = await userRepo.findByEmail(email);
  if (existing) throw new ConflictError("Email already registered");

  // Self-register can only pick Buyer or Seller. Admin/Manager/Agent must be
  // assigned by an admin via /api/users/:id/roles.
  const requested = role ? String(role).trim() : "Buyer";
  const normalised = requested.charAt(0).toUpperCase() + requested.slice(1).toLowerCase();
  const allowed = ["Buyer", "Seller"];
  const finalRole = allowed.includes(normalised) ? normalised : "Buyer";

  const passwordHash = await passwordUtil.hash(password);
  const created = await userRepo.create({
    first_name,
    last_name,
    email,
    password_hash: passwordHash,
    password: passwordHash, // legacy column compat
    phone: phone || null,
    is_active: 1,
    name: `${first_name} ${last_name}`.trim(),    // legacy column compat
    role: finalRole.toLowerCase(),                 // legacy enum column (admin|buyer|seller)
  });

  // Assign the chosen RBAC role
  const roleRow = await roleRepo.findByName(finalRole);
  if (roleRow) {
    await roleRepo.assignToUser(created.id, roleRow.id);
  }

  await auditRepo.log({
    userId: created.id,
    action: "register",
    entity: "users",
    entityId: created.id,
    ipAddress: ctx.ipAddress,
    userAgent: ctx.userAgent,
  });

  const fresh = await userRepo.findById(created.id);
  return issueTokenPair(fresh, ctx);
}

async function login({ email, password }, ctx = {}) {
  const user = await userRepo.findByEmail(email);
  if (!user || !user.is_active) throw new AuthError("Invalid credentials");

  const ok = await passwordUtil.compare(password, user.password_hash || user.password);
  if (!ok) {
    await auditRepo.log({
      userId: user.id,
      action: "login_failed",
      entity: "users",
      entityId: user.id,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });
    throw new AuthError("Invalid credentials");
  }

  await userRepo.touchLastLogin(user.id);
  await auditRepo.log({
    userId: user.id,
    action: "login",
    entity: "users",
    entityId: user.id,
    ipAddress: ctx.ipAddress,
    userAgent: ctx.userAgent,
  });

  return issueTokenPair(user, ctx);
}

async function refresh({ refreshToken }, ctx = {}) {
  if (!refreshToken) throw new AuthError("Refresh token required");
  const payload = jwtUtil.verifyRefresh(refreshToken);
  const tokenHash = jwtUtil.hashToken(refreshToken);

  // Fast path: Redis revocation list (B29). Gracefully no-ops when Redis is off.
  const cache = require("./cache.service");
  if (await cache.isRefreshTokenRevoked(refreshToken)) {
    throw new AuthError("Refresh token revoked");
  }

  const stored = await refreshRepo.findActiveByHash(tokenHash);
  if (!stored) throw new AuthError("Refresh token revoked or unknown");
  if (Number(stored.user_id) !== Number(payload.sub)) {
    throw new AuthError("Refresh token user mismatch");
  }

  const user = await userRepo.findActiveById(payload.sub);
  if (!user) throw new AuthError("User no longer active");

  // Rotation: issue new pair, revoke old and link replaced_by
  const newPair = await issueTokenPair(user, ctx);
  const newHash = jwtUtil.hashToken(newPair.refreshToken);
  const newRow = await refreshRepo.findActiveByHash(newHash);
  await refreshRepo.revoke(stored.id, newRow ? newRow.id : null);
  await cache.markRefreshTokenRevoked(refreshToken);

  return newPair;
}

async function logout({ refreshToken }) {
  if (!refreshToken) return { revoked: false };
  try {
    jwtUtil.verifyRefresh(refreshToken);
  } catch (_) {
    /* fall through — even invalid tokens we just no-op */
  }
  const tokenHash = jwtUtil.hashToken(refreshToken);
  const row = await refreshRepo.findActiveByHash(tokenHash);
  if (!row) return { revoked: false };
  await refreshRepo.revoke(row.id);
  // Mirror the revocation into Redis so /refresh fast-rejects without a DB hit.
  const cache = require("./cache.service");
  await cache.markRefreshTokenRevoked(refreshToken);
  return { revoked: true };
}

async function logoutAll(userId) {
  const n = await refreshRepo.revokeAllForUser(userId);
  // Kick every open socket for this user (B33 acceptance criterion).
  // Lazy require to avoid load-order coupling with sockets/index.js.
  try {
    const blertSockets = require("../sockets");
    blertSockets.emitSessionRevoked(userId, "logout_all");
  } catch (_) { /* sockets not yet wired; safe to ignore */ }
  return { revoked: n };
}

async function me(userId) {
  const user = await userRepo.findUserWithRolesAndPermissions(userId);
  if (!user) throw new NotFoundError("User not found");
  return publicUserShape(user, user.roles, user.permissions);
}

async function changePassword(userId, { currentPassword, newPassword }, ctx = {}) {
  const user = await userRepo.findById(userId);
  if (!user) throw new NotFoundError("User not found");
  const ok = await passwordUtil.compare(currentPassword, user.password_hash || user.password);
  if (!ok) throw new AuthError("Current password is incorrect");

  const hash = await passwordUtil.hash(newPassword);
  await userRepo.setPasswordHash(userId, hash);
  // keep legacy `password` column in sync
  const db = require("../config/db");
  await db.query(`UPDATE users SET password = ? WHERE id = ?`, [hash, userId]);

  // Revoke all sessions on password change for safety
  await refreshRepo.revokeAllForUser(userId);

  await auditRepo.log({
    userId,
    action: "change_password",
    entity: "users",
    entityId: userId,
    ipAddress: ctx.ipAddress,
    userAgent: ctx.userAgent,
  });

  return { ok: true };
}

async function forgotPassword({ email }) {
  // Stub: lookup user, log intent. Email sending is a follow-up.
  const user = await userRepo.findByEmail(email);
  if (user) {
    logger.info(`Password reset requested for user ${user.id} (${email}) — email transport not configured.`);
  }
  // Always respond OK to avoid email enumeration
  return { ok: true };
}

module.exports = {
  register,
  login,
  refresh,
  logout,
  logoutAll,
  me,
  changePassword,
  forgotPassword,
  publicUserShape,
};

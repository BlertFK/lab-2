/**
 * @openapi
 * tags:
 *   - name: Auth
 *     description: Authentication, registration, refresh-token rotation, password
 */

const authService = require("../services/auth.service");

function ctxFromReq(req) {
  return {
    ipAddress: (req.headers["x-forwarded-for"] || req.ip || "").toString().split(",")[0].trim(),
    userAgent: (req.headers["user-agent"] || "").toString(),
  };
}

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Create a new user (default role Buyer)
 *     security: []
 *     responses:
 *       201: { description: User created, returns token pair }
 *       409: { description: Email already registered }
 */
async function register(req, res, next) {
  try {
    const result = await authService.register(req.body, ctxFromReq(req));
    res.status(201).json(result);
  } catch (err) { next(err); }
}

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Exchange email + password for access + refresh tokens
 *     security: []
 *     responses:
 *       200: { description: Token pair }
 *       401: { description: Invalid credentials }
 */
async function login(req, res, next) {
  try {
    const result = await authService.login(req.body, ctxFromReq(req));
    res.json(result);
  } catch (err) { next(err); }
}

/**
 * @openapi
 * /api/auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Rotate refresh token, return a fresh access + refresh pair
 *     security: []
 */
async function refresh(req, res, next) {
  try {
    const result = await authService.refresh(req.body, ctxFromReq(req));
    res.json(result);
  } catch (err) { next(err); }
}

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Revoke the supplied refresh token
 */
async function logout(req, res, next) {
  try {
    const result = await authService.logout(req.body);
    res.json(result);
  } catch (err) { next(err); }
}

/**
 * @openapi
 * /api/auth/logout-all:
 *   post:
 *     tags: [Auth]
 *     summary: Revoke every refresh token issued to the current user
 */
async function logoutAll(req, res, next) {
  try {
    const result = await authService.logoutAll(req.user.id);
    res.json(result);
  } catch (err) { next(err); }
}

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Return current user including roles + permissions
 */
async function me(req, res, next) {
  try {
    const result = await authService.me(req.user.id);
    res.json({ user: result });
  } catch (err) { next(err); }
}

/**
 * @openapi
 * /api/auth/change-password:
 *   post:
 *     tags: [Auth]
 *     summary: Change current password, revokes all sessions
 */
async function changePassword(req, res, next) {
  try {
    const result = await authService.changePassword(req.user.id, req.body, ctxFromReq(req));
    res.json(result);
  } catch (err) { next(err); }
}

/**
 * @openapi
 * /api/auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request a password reset email (always 200 to avoid enumeration)
 *     security: []
 */
async function forgotPassword(req, res, next) {
  try {
    const result = await authService.forgotPassword(req.body);
    res.json(result);
  } catch (err) { next(err); }
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
};

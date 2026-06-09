const { verifyAccess } = require("../utils/jwt.util");
const { AuthError, ForbiddenError } = require("../utils/errors.util");

function parseBearer(req) {
  const header = req.headers["authorization"] || req.headers["Authorization"];
  if (!header) return null;
  const [scheme, token] = header.split(" ");
  if (!scheme || scheme.toLowerCase() !== "bearer" || !token) return null;
  return token;
}

function authenticate(req, _res, next) {
  const token = parseBearer(req);
  if (!token) return next(new AuthError("Missing Bearer token"));
  try {
    const payload = verifyAccess(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      roles: payload.roles || [],
      permissions: payload.permissions || [],
      // legacy single-role compat for Fadil's controllers (`req.user.role`)
      role: (payload.roles && payload.roles[0]) || payload.role || null,
    };
    req.accessToken = token;
    return next();
  } catch (err) {
    return next(err);
  }
}

// Like authenticate, but lets the request through anonymously when no token is present.
function optionalAuth(req, _res, next) {
  const token = parseBearer(req);
  if (!token) return next();
  try {
    const payload = verifyAccess(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      roles: payload.roles || [],
      permissions: payload.permissions || [],
      role: (payload.roles && payload.roles[0]) || payload.role || null,
    };
    req.accessToken = token;
  } catch (_) {
    // ignore bad tokens for optional auth
  }
  return next();
}

function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(new AuthError());
    const has = req.user.roles.some((r) => roles.includes(r));
    if (!has) return next(new ForbiddenError(`Requires role: ${roles.join(" or ")}`));
    return next();
  };
}

module.exports = { authenticate, optionalAuth, requireRole, parseBearer };

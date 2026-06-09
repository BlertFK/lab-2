const { AuthError, ForbiddenError } = require("../utils/errors.util");

/**
 * requirePermission('users.view')
 *
 * Permissions follow the resource.action[.scope] naming scheme. The middleware
 * grants access when the user holds the exact permission OR a broader '.any'
 * variant of the same resource.action when the requested scope is '.own'.
 *
 * Admins (role name 'Admin' or 'admin') bypass the check, since the seeded
 * Admin role is wired with the full permission catalogue.
 */
function requirePermission(name) {
  return (req, _res, next) => {
    if (!req.user) return next(new AuthError());

    const isAdmin = (req.user.roles || []).some(
      (r) => String(r).toLowerCase() === "admin"
    );
    if (isAdmin) return next();

    const perms = req.user.permissions || [];
    if (perms.includes(name)) return next();

    // .own scope can be upgraded by .any
    if (name.endsWith(".own")) {
      const broader = name.replace(/\.own$/, ".any");
      if (perms.includes(broader)) return next();
    }

    return next(new ForbiddenError(`Missing permission: ${name}`));
  };
}

function requireAny(...names) {
  return (req, _res, next) => {
    if (!req.user) return next(new AuthError());
    const isAdmin = (req.user.roles || []).some(
      (r) => String(r).toLowerCase() === "admin"
    );
    if (isAdmin) return next();
    const perms = req.user.permissions || [];
    if (names.some((n) => perms.includes(n))) return next();
    return next(new ForbiddenError(`Missing any of: ${names.join(", ")}`));
  };
}

module.exports = { requirePermission, requireAny };

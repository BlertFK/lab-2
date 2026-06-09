// Legacy auth middleware kept alive so Fadil's controllers (which read
// req.user.role) keep working when the client carries either:
//   - a legacy token signed with JWT_SECRET (pre-Blert)
//   - a new access token signed with JWT_ACCESS_SECRET (Blert auth controller)
//
// New code should prefer middleware/auth.middleware.js (`authenticate`).

const jwt = require("jsonwebtoken");
require("dotenv").config();

function tryVerify(token, secret) {
  if (!secret) return null;
  try {
    return jwt.verify(token, secret);
  } catch (_) {
    return null;
  }
}

const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  // Try new access secret first, then legacy
  const decoded =
    tryVerify(token, process.env.JWT_ACCESS_SECRET) ||
    tryVerify(token, process.env.JWT_SECRET);

  if (!decoded) {
    return res.status(403).json({ message: "Invalid or expired token." });
  }

  // Normalise so legacy `req.user.role` and `req.user.id` continue to exist.
  // Lab-1 controllers compare against lowercase strings ('buyer','seller','admin'),
  // while the new RBAC seeds use PascalCase ('Buyer','Seller','Admin'). Lowercase
  // the legacy `role` field so existing equality checks keep passing.
  const roles = decoded.roles || (decoded.role ? [decoded.role] : []);
  const primaryRole = decoded.role || roles[0] || null;
  req.user = {
    id: decoded.id || decoded.sub,
    sub: decoded.sub || decoded.id,
    email: decoded.email,
    role: primaryRole ? String(primaryRole).toLowerCase() : null,
    roles,
    permissions: decoded.permissions || [],
  };
  next();
};

const requireRole = (...roles) => (req, res, next) => {
  const userRoles = req.user?.roles?.length ? req.user.roles : [req.user?.role];
  const allowed = userRoles.some((r) => roles.includes(String(r).toLowerCase()) || roles.includes(r));
  if (!allowed) {
    return res.status(403).json({ message: "Access denied. Insufficient permissions." });
  }
  next();
};

module.exports = { verifyToken, requireRole };

// Blert: write an AuditLog row when a successful mutating response is sent.
//
// Usage:
//   router.post('/x', auditAction('create', 'x'), createX)
//   router.put('/x/:id', auditAction('update', 'x', (req) => req.params.id), updateX)

const auditService = require("../services/audit.service");
const logger = require("../config/logger");

function ipOf(req) {
  return (req.headers["x-forwarded-for"] || req.ip || "").toString().split(",")[0].trim() || null;
}

function uaOf(req) {
  return (req.headers["user-agent"] || "").toString().substring(0, 255) || null;
}

function auditAction(action, entity, entityIdResolver) {
  return (req, res, next) => {
    res.on("finish", () => {
      // Only audit successful mutations
      if (res.statusCode >= 400) return;
      try {
        const entityId = typeof entityIdResolver === "function"
          ? entityIdResolver(req, res)
          : null;

        auditService.log({
          userId: req.user ? req.user.id : null,
          action,
          entity,
          entityId: entityId ? Number(entityId) : null,
          newValue: req.body && Object.keys(req.body).length ? sanitize(req.body) : null,
          ipAddress: ipOf(req),
          userAgent: uaOf(req),
        }).catch((err) => logger.warn(`audit write failed: ${err.message}`));
      } catch (err) {
        logger.warn(`audit middleware error: ${err.message}`);
      }
    });
    next();
  };
}

function sanitize(body) {
  const cloned = { ...body };
  for (const k of Object.keys(cloned)) {
    if (/password|token|secret/i.test(k)) cloned[k] = "***";
  }
  return cloned;
}

module.exports = { auditAction };

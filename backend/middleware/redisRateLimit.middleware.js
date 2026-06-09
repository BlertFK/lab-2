// B30: Redis-backed rate limiter. Falls back transparently to the in-process
// express-rate-limit when Redis is disabled — that way single-instance
// deployments work without Redis, and multi-instance ones get shared counters
// when REDIS_ENABLED=true.

const { incrRateLimit } = require("../services/cache.service");
const redis = require("../config/redis");
const { RateLimitError } = require("../utils/errors.util");

function clientKey(req, scope) {
  const ip = (req.headers["x-forwarded-for"] || req.ip || "anon")
    .toString()
    .split(",")[0]
    .trim();
  const user = req.user?.id ? `u${req.user.id}` : `ip${ip}`;
  return `ratelimit:${scope}:${user}`;
}

function redisRateLimit({ scope = "api", windowSeconds = 60, max = 120 } = {}) {
  return async (req, _res, next) => {
    if (!redis.isConnected()) return next();
    try {
      const key = clientKey(req, scope);
      const count = await incrRateLimit(key, windowSeconds);
      if (count != null && count > max) {
        return next(new RateLimitError(`Rate limit exceeded for ${scope}.`));
      }
    } catch (_) {
      // Never let limiter errors break the request — just pass through.
    }
    return next();
  };
}

module.exports = redisRateLimit;

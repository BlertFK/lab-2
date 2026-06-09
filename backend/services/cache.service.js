// Blert: Redis-backed cache + revocation list helpers.
// All helpers degrade gracefully when REDIS_ENABLED=false (return null / no-op).

const redis = require("../config/redis");
const jwtUtil = require("../utils/jwt.util");

async function cacheGet(key) {
  const raw = await redis.safeGet(key);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch (_) { return raw; }
}

async function cacheSet(key, value, ttlSeconds) {
  const serialized = typeof value === "string" ? value : JSON.stringify(value);
  return redis.safeSet(key, serialized, ttlSeconds);
}

async function cacheDel(key) {
  return redis.safeDel(key);
}

async function markRefreshTokenRevoked(refreshToken) {
  const hash = jwtUtil.hashToken(refreshToken);
  // ttl chosen as remaining lifetime of the refresh token (best effort: full window)
  return redis.safeSet(`revoked:${hash}`, "1", Math.floor(jwtUtil.parseExpiry("7d") / 1000));
}

async function isRefreshTokenRevoked(refreshToken) {
  const hash = jwtUtil.hashToken(refreshToken);
  const val = await redis.safeGet(`revoked:${hash}`);
  return val === "1";
}

async function incrRateLimit(key, ttlSeconds) {
  return redis.safeIncr(key, ttlSeconds);
}

module.exports = {
  cacheGet,
  cacheSet,
  cacheDel,
  markRefreshTokenRevoked,
  isRefreshTokenRevoked,
  incrRateLimit,
};

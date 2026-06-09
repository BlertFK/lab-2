const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const env = require("../config/env");
const { AuthError } = require("./errors.util");

function signAccess(payload) {
  return jwt.sign(payload, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessExpiresIn,
    issuer: env.appName,
  });
}

function signRefresh(payload) {
  return jwt.sign(payload, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpiresIn,
    issuer: env.appName,
  });
}

function verifyAccess(token) {
  try {
    return jwt.verify(token, env.jwt.accessSecret, { issuer: env.appName });
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      throw new AuthError("Access token expired");
    }
    throw new AuthError("Invalid access token");
  }
}

function verifyRefresh(token) {
  try {
    return jwt.verify(token, env.jwt.refreshSecret, { issuer: env.appName });
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      throw new AuthError("Refresh token expired");
    }
    throw new AuthError("Invalid refresh token");
  }
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function parseExpiry(input) {
  // jsonwebtoken accepts ms numbers OR strings like '15m', '7d'
  if (typeof input === "number") return input * 1000;
  const match = /^(\d+)\s*([smhdw])$/.exec(String(input).trim());
  if (!match) return 15 * 60 * 1000;
  const n = parseInt(match[1], 10);
  const unit = match[2];
  const multipliers = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000, w: 604_800_000 };
  return n * multipliers[unit];
}

function refreshExpiryDate() {
  return new Date(Date.now() + parseExpiry(env.jwt.refreshExpiresIn));
}

module.exports = {
  signAccess,
  signRefresh,
  verifyAccess,
  verifyRefresh,
  hashToken,
  parseExpiry,
  refreshExpiryDate,
};

const bcrypt = require("bcryptjs");
const env = require("../config/env");

async function hash(plain) {
  return bcrypt.hash(plain, env.jwt.bcryptRounds);
}

async function compare(plain, hashed) {
  if (!plain || !hashed) return false;
  return bcrypt.compare(plain, hashed);
}

module.exports = { hash, compare };

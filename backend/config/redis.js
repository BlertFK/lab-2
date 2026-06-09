const Redis = require("ioredis");
const env = require("./env");
const logger = require("./logger");

let client = null;
let connected = false;

function buildKey(...parts) {
  return [env.redis.prefix, ...parts].filter(Boolean).join(":");
}

function getClient() {
  if (!env.redis.enabled) return null;
  if (client) return client;

  client = new Redis(env.redis.url, {
    lazyConnect: true,
    maxRetriesPerRequest: 2,
    enableOfflineQueue: false,
  });

  client.on("connect", () => {
    connected = true;
    logger.info(`Redis connected (${env.redis.url})`);
  });
  client.on("error", (err) => {
    connected = false;
    logger.warn(`Redis error: ${err.message}`);
  });
  client.on("end", () => {
    connected = false;
  });

  return client;
}

async function init() {
  if (!env.redis.enabled) {
    logger.info("Redis disabled (REDIS_ENABLED=false). Cache features are inert.");
    return null;
  }
  const c = getClient();
  try {
    await c.connect();
    await c.ping();
  } catch (err) {
    logger.warn(`Redis init failed; running without cache: ${err.message}`);
  }
  return c;
}

function isConnected() {
  return !!(client && connected);
}

async function safeGet(key) {
  if (!isConnected()) return null;
  try {
    return await client.get(buildKey(key));
  } catch (err) {
    logger.warn(`Redis GET ${key} failed: ${err.message}`);
    return null;
  }
}

async function safeSet(key, value, ttlSeconds) {
  if (!isConnected()) return false;
  try {
    const k = buildKey(key);
    if (ttlSeconds) {
      await client.set(k, value, "EX", ttlSeconds);
    } else {
      await client.set(k, value);
    }
    return true;
  } catch (err) {
    logger.warn(`Redis SET ${key} failed: ${err.message}`);
    return false;
  }
}

async function safeDel(key) {
  if (!isConnected()) return false;
  try {
    await client.del(buildKey(key));
    return true;
  } catch (err) {
    logger.warn(`Redis DEL ${key} failed: ${err.message}`);
    return false;
  }
}

async function safeIncr(key, ttlSeconds) {
  if (!isConnected()) return null;
  try {
    const k = buildKey(key);
    const value = await client.incr(k);
    if (value === 1 && ttlSeconds) {
      await client.expire(k, ttlSeconds);
    }
    return value;
  } catch (err) {
    logger.warn(`Redis INCR ${key} failed: ${err.message}`);
    return null;
  }
}

module.exports = {
  init,
  getClient,
  isConnected,
  buildKey,
  safeGet,
  safeSet,
  safeDel,
  safeIncr,
};

// B34: Nightly job — delete RefreshTokens whose expires_at is more than a day
// in the past. Runs in-process via node-cron. Safe to start multiple times
// (idempotent on the SQL side).

const cron = require("node-cron");
const refreshRepo = require("../repositories/refreshToken.repository");
const logger = require("../config/logger");

let task = null;

function start({ schedule = "15 3 * * *" } = {}) {
  if (task) return task;
  task = cron.schedule(schedule, async () => {
    try {
      const n = await refreshRepo.deleteExpired();
      logger.info(`tokenCleanup: removed ${n} expired refresh tokens`);
    } catch (err) {
      logger.warn(`tokenCleanup failed: ${err.message}`);
    }
  });
  logger.info(`tokenCleanup scheduled (${schedule})`);
  return task;
}

function stop() {
  if (task) {
    task.stop();
    task = null;
  }
}

module.exports = { start, stop };

// B33: Presence + session events.
// - presence:online / presence:offline broadcast to admin room
// - session:revoked emitted to a specific user to kick them off

const logger = require("../config/logger");
const redis = require("../config/redis");

const PRESENCE_TTL = 60; // seconds

async function markOnline(userId) {
  if (!userId) return;
  await redis.safeSet(`presence:${userId}`, "1", PRESENCE_TTL);
}

async function markOffline(userId) {
  if (!userId) return;
  await redis.safeDel(`presence:${userId}`);
}

function emitOnline(io, userId) {
  if (!io || !userId) return;
  io.to("admin").emit("presence:online", { user_id: userId });
}

function emitOffline(io, userId) {
  if (!io || !userId) return;
  io.to("admin").emit("presence:offline", { user_id: userId, last_seen: new Date().toISOString() });
}

function emitSessionRevoked(io, userId, reason = "logout_all") {
  if (!io || !userId) return;
  logger.info(`session:revoked → user:${userId} (reason: ${reason})`);
  io.to(`user:${userId}`).emit("session:revoked", { reason });
}

function bindPresenceHandlers(io, socket) {
  const userId = socket.user?.id;
  if (!userId) return;

  markOnline(userId).then(() => emitOnline(io, userId));

  socket.on("presence:ping", () => {
    markOnline(userId);
  });

  socket.on("disconnect", async () => {
    // Only emit offline when this user has no other active sockets
    const room = io.sockets.adapter.rooms.get(`user:${userId}`);
    const others = room ? room.size : 0;
    if (others === 0) {
      await markOffline(userId);
      emitOffline(io, userId);
    }
  });
}

module.exports = {
  bindPresenceHandlers,
  emitSessionRevoked,
  emitOnline,
  emitOffline,
};

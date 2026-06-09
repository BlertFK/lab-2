// B32: Server-side emit helpers for notification:* events.
// Pure functions over the io instance; persistence is the caller's job.

function emitNotificationNew(io, userId, notification) {
  if (!io || !userId) return;
  io.to(`user:${userId}`).emit("notification:new", notification);
}

function emitNotificationRead(io, userId, notificationId) {
  if (!io || !userId) return;
  io.to(`user:${userId}`).emit("notification:read", { id: notificationId });
}

function emitAuditCritical(io, payload) {
  if (!io) return;
  io.to("admin").emit("audit:critical", payload);
}

module.exports = {
  emitNotificationNew,
  emitNotificationRead,
  emitAuditCritical,
};

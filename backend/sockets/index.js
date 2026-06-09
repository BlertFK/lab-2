// B31: Blert's socket bootstrap. Sits next to Fadil's socketService.
// Fadil's service handles JWT verify in its own io.use() and binds the
// message/thread/offer event surface. This module:
//   1. Attaches a SECOND io.use() that joins the admin room when applicable
//      (idempotent — it doesn't re-verify the token).
//   2. Hooks into connection to bind presence handlers (presence:ping,
//      online/offline broadcast).
//   3. Exports emit helpers used by HTTP controllers to dispatch
//      session:revoked, notification:new, audit:critical.

const { bindPresenceHandlers, emitSessionRevoked } = require("./presence.events");
const notificationEvents = require("./notification.events");

let ioInstance = null;

function attach(io) {
  ioInstance = io;

  // Auth has already been done by Fadil's socketService io.use() before this
  // middleware runs. We only need to join the admin broadcast room when the
  // socket carries the Admin role.
  io.use((socket, next) => {
    const roles = socket.user?.roles || [];
    if (roles.some((r) => String(r).toLowerCase() === "admin")) {
      socket.join("admin");
    }
    next();
  });

  io.on("connection", (socket) => {
    bindPresenceHandlers(io, socket);
  });

  return io;
}

function getIo() {
  return ioInstance;
}

module.exports = {
  attach,
  getIo,
  emitSessionRevoked: (userId, reason) => emitSessionRevoked(ioInstance, userId, reason),
  emitNotificationNew: (userId, payload) => notificationEvents.emitNotificationNew(ioInstance, userId, payload),
  emitNotificationRead: (userId, id) => notificationEvents.emitNotificationRead(ioInstance, userId, id),
  emitAuditCritical: (payload) => notificationEvents.emitAuditCritical(ioInstance, payload),
};

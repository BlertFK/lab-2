const jwt = require("jsonwebtoken");
const messageRepository = require("../repositories/messageRepository");

let ioInstance = null;

const threadRoom = (threadId) => `thread:${threadId}`;
const userRoom = (userId) => `user:${userId}`;

const setIo = (io) => {
  ioInstance = io;
};

const emitToThread = (threadId, event, payload) => {
  if (!ioInstance || !threadId) return;
  ioInstance.to(threadRoom(threadId)).emit(event, payload);
};

const emitToUser = (userId, event, payload) => {
  if (!ioInstance || !userId) return;
  ioInstance.to(userRoom(userId)).emit(event, payload);
};

const emitToUsers = (userIds, event, payload) => {
  [...new Set((userIds || []).filter(Boolean))].forEach((userId) => {
    emitToUser(userId, event, payload);
  });
};

const normalizeThreadId = (payload = {}) => payload.thread_id || payload.threadId || payload.id;

const canAccessThread = (thread, user) => {
  if (!thread || !user) return false;
  if (user.role === "admin") return true;
  return thread.buyer_id === user.id || thread.seller_id === user.id;
};

const addSocketAuth = (io) => {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token
      || socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, "");

    if (!token) {
      return next(new Error("Access denied. No token provided."));
    }

    // Accept both new (Blert) access tokens and legacy tokens
    const tryVerify = (secret) => {
      if (!secret) return null;
      try { return jwt.verify(token, secret); } catch { return null; }
    };
    const decoded = tryVerify(process.env.JWT_ACCESS_SECRET) || tryVerify(process.env.JWT_SECRET);
    if (!decoded) {
      return next(new Error("Invalid or expired token."));
    }

    const roles = decoded.roles || (decoded.role ? [decoded.role] : []);
    socket.user = {
      id: decoded.id || decoded.sub,
      sub: decoded.sub || decoded.id,
      email: decoded.email,
      role: decoded.role || roles[0] || null,
      roles,
      permissions: decoded.permissions || [],
      name: decoded.name,
    };
    return next();
  });
};

const getThreadForSocket = async (threadId, socket) => {
  const threadService = require("./threadService");
  return threadService.getThreadForUser(threadId, socket.user);
};

const emitAck = (ack, payload) => {
  if (typeof ack === "function") ack(payload);
};

const registerSocketHandlers = (io) => {
  if (!io) return;

  setIo(io);
  addSocketAuth(io);

  io.on("connection", (socket) => {
    if (socket.user?.id) {
      socket.join(userRoom(socket.user.id));
    }

    socket.on("thread:join", async (payload = {}, ack) => {
      try {
        const threadId = normalizeThreadId(payload);
        const thread = await getThreadForSocket(threadId, socket);
        socket.join(threadRoom(thread.id));
        emitAck(ack, { ok: true, thread_id: thread.id });
      } catch (error) {
        emitAck(ack, { ok: false, message: error.message });
      }
    });

    socket.on("thread:leave", (payload = {}, ack) => {
      const threadId = normalizeThreadId(payload);
      if (threadId) socket.leave(threadRoom(threadId));
      emitAck(ack, { ok: true, thread_id: threadId });
    });

    socket.on("thread:typing", async (payload = {}, ack) => {
      try {
        const threadId = normalizeThreadId(payload);
        const thread = await getThreadForSocket(threadId, socket);
        socket.to(threadRoom(thread.id)).emit("thread:typing", {
          thread_id: thread.id,
          user_id: socket.user.id,
          user_name: socket.user.name,
          is_typing: Boolean(payload.is_typing),
        });
        emitAck(ack, { ok: true });
      } catch (error) {
        emitAck(ack, { ok: false, message: error.message });
      }
    });

    socket.on("message:new", async (payload = {}, ack) => {
      try {
        const threadId = normalizeThreadId(payload);
        const messageService = require("./messageService");
        const message = await messageService.sendThreadMessage(
          threadId,
          { body: payload.body, attachment_file_id: payload.attachment_file_id },
          socket.user
        );
        emitAck(ack, { ok: true, message });
      } catch (error) {
        emitAck(ack, { ok: false, message: error.message });
      }
    });

    socket.on("message:read", async (payload = {}, ack) => {
      try {
        const messageId = payload.message_id || payload.messageId || payload.id;
        const messageService = require("./messageService");
        const message = await messageService.markMessageRead(messageId, socket.user);
        emitAck(ack, { ok: true, message });
      } catch (error) {
        emitAck(ack, { ok: false, message: error.message });
      }
    });

    socket.on("thread:updated", async (payload = {}, ack) => {
      try {
        const threadId = normalizeThreadId(payload);
        const thread = await getThreadForSocket(threadId, socket);
        if (!canAccessThread(thread, socket.user)) {
          emitAck(ack, { ok: false, message: "You do not have access to this thread." });
          return;
        }
        socket.to(threadRoom(thread.id)).emit("thread:updated", { thread });
        emitAck(ack, { ok: true, thread });
      } catch (error) {
        emitAck(ack, { ok: false, message: error.message });
      }
    });
  });
};

const emitMessageRead = async (messageId, user) => {
  const message = await messageRepository.findById(messageId);
  if (!message) return null;
  emitToThread(message.thread_id, "message:read", { message, user_id: user?.id });
  return message;
};

module.exports = {
  setIo,
  registerSocketHandlers,
  emitToThread,
  emitToUser,
  emitToUsers,
  emitMessageRead,
};

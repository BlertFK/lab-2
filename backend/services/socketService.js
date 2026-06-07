let ioInstance = null;

const threadRoom = (threadId) => `thread:${threadId}`;

const setIo = (io) => {
  ioInstance = io;
};

const emitToThread = (threadId, event, payload) => {
  if (!ioInstance || !threadId) return;
  ioInstance.to(threadRoom(threadId)).emit(event, payload);
};

const registerSocketHandlers = (io) => {
  if (!io) return;

  setIo(io);
  io.on("connection", (socket) => {
    socket.on("thread:join", ({ thread_id }) => {
      if (thread_id) socket.join(threadRoom(thread_id));
    });

    socket.on("thread:leave", ({ thread_id }) => {
      if (thread_id) socket.leave(threadRoom(thread_id));
    });

    socket.on("thread:typing", ({ thread_id, user_id, is_typing }) => {
      if (!thread_id) return;
      socket.to(threadRoom(thread_id)).emit("thread:typing", {
        thread_id,
        user_id,
        is_typing: Boolean(is_typing),
      });
    });
  });
};

module.exports = {
  setIo,
  registerSocketHandlers,
  emitToThread,
};

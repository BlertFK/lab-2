const db = require("../config/db");
const messageRepository = require("../repositories/messageRepository");
const threadRepository = require("../repositories/threadRepository");
const threadService = require("./threadService");
const socketService = require("./socketService");

const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const getMessagesForThread = async (threadId, user) => {
  await threadService.getThreadForUser(threadId, user);
  return messageRepository.findByThreadId(threadId);
};

const sendThreadMessage = async (threadId, body, user) => {
  const thread = await threadService.getThreadForUser(threadId, user);
  const messageBody = typeof body.body === "string" ? body.body.trim() : "";

  if (!messageBody) {
    throw createError("body cannot be empty.");
  }

  let attachmentFileId = null;
  if (body.attachment_file_id !== null && body.attachment_file_id !== undefined && body.attachment_file_id !== "") {
    attachmentFileId = threadService.toPositiveInt(body.attachment_file_id);
    if (!attachmentFileId) {
      throw createError("attachment_file_id must be valid.");
    }
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const messageId = await messageRepository.create(
      {
        thread_id: thread.id,
        sender_id: user.id,
        body: messageBody,
        attachment_file_id: attachmentFileId,
      },
      connection
    );

    await threadRepository.updateLastMessageAt(thread.id, connection);
    await threadRepository.incrementUnreadForRecipient(thread, user.id, connection);

    await connection.commit();

    const message = await messageRepository.findById(messageId);
    const updatedThread = await threadRepository.findById(thread.id);
    const payload = { thread: updatedThread, message };
    const participants = [updatedThread.buyer_id, updatedThread.seller_id];

    socketService.emitToThread(thread.id, "message:new", payload);
    socketService.emitToUsers(participants, "message:new", payload);
    socketService.emitToThread(thread.id, "thread:updated", { thread: updatedThread });
    socketService.emitToUsers(participants, "thread:updated", { thread: updatedThread });

    return message;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const markMessageRead = async (messageId, user) => {
  const id = threadService.toPositiveInt(messageId);
  if (!id) {
    throw createError("message_id must be valid.");
  }

  const message = await messageRepository.findById(id);
  if (!message) {
    throw createError("Message not found.", 404);
  }

  if (message.buyer_id !== user.id && message.seller_id !== user.id) {
    throw createError("You do not have access to this message.", 403);
  }

  if (message.sender_id === user.id) {
    throw createError("Only the message recipient can mark it as read.", 403);
  }

  if (message.read_at) {
    return message;
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const affectedRows = await messageRepository.markRead(id, user.id, connection);
    if (affectedRows) {
      await threadRepository.decrementUnreadForReader(
        { ...message, id: message.thread_id },
        user.id,
        connection
      );
    }

    await connection.commit();

    const updatedMessage = await messageRepository.findById(id);
    const updatedThread = await threadRepository.findById(message.thread_id);
    const participants = [updatedThread.buyer_id, updatedThread.seller_id];
    socketService.emitToThread(message.thread_id, "message:read", { message: updatedMessage });
    socketService.emitToUsers(participants, "message:read", { message: updatedMessage });
    socketService.emitToThread(message.thread_id, "thread:updated", { thread: updatedThread });
    socketService.emitToUsers(participants, "thread:updated", { thread: updatedThread });

    return updatedMessage;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  getMessagesForThread,
  sendThreadMessage,
  markMessageRead,
};

const threadService = require("../services/threadService");
const messageService = require("../services/messageService");

const handleError = (res, error) => {
  console.error("Thread error:", error.message);
  res.status(error.statusCode || 500).json({
    message: error.statusCode ? error.message : "Server error. Please try again.",
  });
};

const getThreads = async (req, res) => {
  try {
    const threads = await threadService.listThreads(req.user);
    res.status(200).json({ threads });
  } catch (error) {
    handleError(res, error);
  }
};

const createThread = async (req, res) => {
  try {
    const thread = await threadService.createOrGetThread(req.body, req.user);
    res.status(201).json({ message: "Thread ready.", thread });
  } catch (error) {
    handleError(res, error);
  }
};

const getThreadMessages = async (req, res) => {
  try {
    const messages = await messageService.getMessagesForThread(req.params.id, req.user);
    res.status(200).json({ messages });
  } catch (error) {
    handleError(res, error);
  }
};

const sendThreadMessage = async (req, res) => {
  try {
    const message = await messageService.sendThreadMessage(req.params.id, req.body, req.user);
    res.status(201).json({ message: "Message sent successfully.", data: message });
  } catch (error) {
    handleError(res, error);
  }
};

module.exports = {
  getThreads,
  createThread,
  getThreadMessages,
  sendThreadMessage,
};

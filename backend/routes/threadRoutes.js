const express = require("express");
const router = express.Router();

const {
  getThreads,
  createThread,
  getThreadMessages,
  sendThreadMessage,
} = require("../controllers/threadController");
const { verifyToken } = require("../middleware/authMiddleware");

router.use(verifyToken);

router.get("/", getThreads);
router.post("/", createThread);
router.get("/:id/messages", getThreadMessages);
router.post("/:id/messages", sendThreadMessage);

module.exports = router;

const express = require("express");
const router = express.Router();

const { sendMessage, getSellerMessages, markMessageRead } = require("../controllers/messageController");
const { verifyToken, requireRole } = require("../middleware/authMiddleware");

router.patch("/:id/read", verifyToken, markMessageRead);
router.post("/", verifyToken, requireRole("buyer"), sendMessage);
router.get("/seller", verifyToken, requireRole("seller"), getSellerMessages);

module.exports = router;

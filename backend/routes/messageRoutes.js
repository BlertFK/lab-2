const express = require("express");
const router = express.Router();

const { sendMessage, getSellerMessages } = require("../controllers/messageController");
const { verifyToken, requireRole } = require("../middleware/authMiddleware");

router.post("/", verifyToken, requireRole("buyer"), sendMessage);
router.get("/seller", verifyToken, requireRole("seller"), getSellerMessages);

module.exports = router;
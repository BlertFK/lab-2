const express = require("express");
const router = express.Router();

const { getBuyerDashboard } = require("../controllers/buyerController");
const { verifyToken, requireRole } = require("../middleware/authMiddleware");

router.get("/dashboard", verifyToken, requireRole("buyer"), getBuyerDashboard);

module.exports = router;

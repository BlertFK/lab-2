const express = require("express");
const router = express.Router();

const {
  getTransactions,
  getTransactionById,
  updateTransactionStatus,
} = require("../controllers/transactionController");
const { verifyToken } = require("../middleware/authMiddleware");

router.use(verifyToken);

router.get("/", getTransactions);
router.get("/:id", getTransactionById);
router.patch("/:id/status", updateTransactionStatus);

module.exports = router;


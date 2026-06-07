const express = require("express");
const router = express.Router();

const {
  createViewing,
  getViewings,
  getViewingById,
  updateViewingStatus,
} = require("../controllers/viewingController");
const { verifyToken } = require("../middleware/authMiddleware");

router.use(verifyToken);

router.get("/", getViewings);
router.get("/:id", getViewingById);
router.post("/", createViewing);
router.patch("/:id/status", updateViewingStatus);

module.exports = router;


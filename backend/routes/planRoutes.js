const express = require("express");
const router = express.Router();

const {
  getPlans,
  getMySubscription,
  subscribe,
} = require("../controllers/planController");
const { verifyToken } = require("../middleware/authMiddleware");

router.get("/", getPlans);

router.use(verifyToken);

router.get("/subscription/me", getMySubscription);
router.post("/subscribe", subscribe);

module.exports = router;

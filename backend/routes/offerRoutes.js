const express = require("express");
const router = express.Router();

const {
  createOffer,
  createCounterOffer,
  getOffers,
  getOfferById,
  updateOfferStatus,
} = require("../controllers/offerController");
const { verifyToken } = require("../middleware/authMiddleware");

router.use(verifyToken);

router.get("/", getOffers);
router.get("/:id", getOfferById);
router.post("/", createOffer);
router.post("/:id/counter", createCounterOffer);
router.patch("/:id/status", updateOfferStatus);

module.exports = router;


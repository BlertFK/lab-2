const express = require("express");
const router = express.Router();

const {
  createReview,
  getPropertyReviews,
  hideReview,
  unhideReview,
} = require("../controllers/reviewController");
const { verifyToken } = require("../middleware/authMiddleware");

router.get("/property/:propertyId", getPropertyReviews);

router.use(verifyToken);

router.post("/", createReview);
router.patch("/:id/hide", hideReview);
router.patch("/:id/unhide", unhideReview);

module.exports = router;


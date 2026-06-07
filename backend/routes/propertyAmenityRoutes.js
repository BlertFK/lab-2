const express = require("express");
const router = express.Router();

const {
  getPropertyAmenities,
  attachAmenity,
  detachAmenity,
} = require("../controllers/propertyAmenityController");
const { verifyToken } = require("../middleware/authMiddleware");

router.get("/:propertyId/amenities", getPropertyAmenities);
router.post("/:propertyId/amenities", verifyToken, attachAmenity);
router.delete("/:propertyId/amenities/:amenityId", verifyToken, detachAmenity);

module.exports = router;


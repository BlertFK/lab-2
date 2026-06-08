const express = require("express");
const router = express.Router();
const {
  createProperty,
  getMyProperties,
  updateProperty,
  deleteProperty,
  getAllProperties,
  getPropertyById,
  getPropertyBySlug,
  updatePropertyStatus,
  getSimilarProperties,
  trackPropertyView,
} = require("../controllers/propertyController");
const { verifyToken } = require("../middleware/authMiddleware");


router.get("/", getAllProperties);
router.get("/my", verifyToken, getMyProperties);   
router.get("/by-slug/:slug", getPropertyBySlug);
router.get("/:id/similar", getSimilarProperties);
router.get("/:id", getPropertyById);               

router.post("/", verifyToken, createProperty);
router.put("/:id", verifyToken, updateProperty);
router.patch("/:id/status", verifyToken, updatePropertyStatus);
router.post("/:id/track-view", trackPropertyView);
router.delete("/:id", verifyToken, deleteProperty);

module.exports = router;

const express = require("express");
const router = express.Router();

const {
  getPropertyImages,
  attachImage,
  detachImage,
  setPrimaryImage,
} = require("../controllers/propertyImageController");
const { verifyToken } = require("../middleware/authMiddleware");

router.get("/:propertyId/images", getPropertyImages);
router.post("/:propertyId/images", verifyToken, attachImage);
router.delete("/:propertyId/images/:imageId", verifyToken, detachImage);
router.patch("/:propertyId/images/:imageId/primary", verifyToken, setPrimaryImage);

module.exports = router;


const express = require("express");
const router = express.Router();
const {
  createProperty,
  getMyProperties,
  updateProperty,
  deleteProperty,
  getAllProperties,
  getPropertyById,
} = require("../controllers/propertyController");
const { verifyToken } = require("../middleware/authMiddleware");


router.get("/", getAllProperties);
router.get("/my", verifyToken, getMyProperties);   
router.get("/:id", getPropertyById);               

router.post("/", verifyToken, createProperty);
router.put("/:id", verifyToken, updateProperty);
router.delete("/:id", verifyToken, deleteProperty);

module.exports = router;
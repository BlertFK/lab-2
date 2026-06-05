const express = require("express");
const router = express.Router();

const {
  getFavorites,
  addFavorite,
  removeFavorite,
} = require("../controllers/favoriteController");
const { verifyToken, requireRole } = require("../middleware/authMiddleware");

router.use(verifyToken, requireRole("buyer"));

router.get("/", getFavorites);
router.post("/:propertyId", addFavorite);
router.delete("/:propertyId", removeFavorite);

module.exports = router;

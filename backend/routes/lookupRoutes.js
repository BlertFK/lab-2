const express = require("express");
const router = express.Router();

const {
  getPropertyTypes,
  getCategories,
  getCities,
  getAmenities,
} = require("../controllers/lookupController");

router.get("/property-types", getPropertyTypes);
router.get("/categories", getCategories);
router.get("/cities", getCities);
router.get("/amenities", getAmenities);

module.exports = router;

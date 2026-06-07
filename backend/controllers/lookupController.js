const lookupService = require("../services/lookupService");

const handleError = (res, error) => {
  console.error("Lookup error:", error.message);
  res.status(error.statusCode || 500).json({
    message: error.statusCode ? error.message : "Server error. Please try again.",
  });
};

const getPropertyTypes = async (req, res) => {
  try {
    const propertyTypes = await lookupService.listPropertyTypes();
    res.status(200).json({ propertyTypes });
  } catch (error) {
    handleError(res, error);
  }
};

const getCategories = async (req, res) => {
  try {
    const categories = await lookupService.listCategories();
    res.status(200).json({ categories });
  } catch (error) {
    handleError(res, error);
  }
};

const getCities = async (req, res) => {
  try {
    const cities = await lookupService.listCities();
    res.status(200).json({ cities });
  } catch (error) {
    handleError(res, error);
  }
};

const getAmenities = async (req, res) => {
  try {
    const amenities = await lookupService.listAmenities();
    res.status(200).json({ amenities });
  } catch (error) {
    handleError(res, error);
  }
};

module.exports = {
  getPropertyTypes,
  getCategories,
  getCities,
  getAmenities,
};

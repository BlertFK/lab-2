const propertyAmenityRepository = require("../repositories/propertyAmenityRepository");

const isPositiveId = (value) => Number.isInteger(Number(value)) && Number(value) > 0;

const handleError = (res, error) => {
  console.error("Property amenity error:", error.message);
  res.status(500).json({ message: "Server error. Please try again." });
};

const getPropertyAmenities = async (req, res) => {
  try {
    const amenities = await propertyAmenityRepository.listByProperty(req.params.propertyId);
    res.status(200).json({ amenities });
  } catch (error) {
    handleError(res, error);
  }
};

const attachAmenity = async (req, res) => {
  const propertyId = Number(req.params.propertyId);
  const amenityId = Number(req.body.amenity_id || req.params.amenityId);

  if (!isPositiveId(propertyId) || !isPositiveId(amenityId)) {
    return res.status(400).json({ message: "Valid property_id and amenity_id are required." });
  }

  try {
    const amenities = await propertyAmenityRepository.attach(propertyId, amenityId);
    res.status(201).json({ message: "Amenity attached to property.", amenities });
  } catch (error) {
    handleError(res, error);
  }
};

const detachAmenity = async (req, res) => {
  const propertyId = Number(req.params.propertyId);
  const amenityId = Number(req.params.amenityId);

  if (!isPositiveId(propertyId) || !isPositiveId(amenityId)) {
    return res.status(400).json({ message: "Valid property_id and amenity_id are required." });
  }

  try {
    const affectedRows = await propertyAmenityRepository.detach(propertyId, amenityId);
    if (!affectedRows) return res.status(404).json({ message: "Amenity link not found." });
    res.status(200).json({ message: "Amenity detached from property." });
  } catch (error) {
    handleError(res, error);
  }
};

module.exports = {
  getPropertyAmenities,
  attachAmenity,
  detachAmenity,
};


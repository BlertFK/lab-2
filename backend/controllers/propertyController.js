const propertyService = require("../services/propertyService");

const handleError = (res, error, context) => {
  console.error(`${context} error:`, error.message);
  res.status(error.statusCode || 500).json({
    message: error.statusCode ? error.message : "Server error. Please try again.",
  });
};

const getAllProperties = async (req, res) => {
  try {
    const properties = await propertyService.listProperties(req.query);
    res.status(200).json({ properties });
  } catch (error) {
    handleError(res, error, "getAllProperties");
  }
};

const getMyProperties = async (req, res) => {
  try {
    const properties = await propertyService.listMyProperties(req.user);
    res.status(200).json({ properties });
  } catch (error) {
    handleError(res, error, "getMyProperties");
  }
};

const getPropertyById = async (req, res) => {
  try {
    const property = await propertyService.getPropertyById(req.params.id);
    res.status(200).json({ property });
  } catch (error) {
    handleError(res, error, "getPropertyById");
  }
};

const getPropertyBySlug = async (req, res) => {
  try {
    const property = await propertyService.getPropertyBySlug(req.params.slug);
    res.status(200).json({ property });
  } catch (error) {
    handleError(res, error, "getPropertyBySlug");
  }
};

const createProperty = async (req, res) => {
  try {
    const property = await propertyService.createProperty(req.body, req.user);
    res.status(201).json({
      message: "Property created successfully.",
      propertyId: property.id,
      property,
    });
  } catch (error) {
    handleError(res, error, "createProperty");
  }
};

const updateProperty = async (req, res) => {
  try {
    const property = await propertyService.updateProperty(req.params.id, req.body, req.user);
    res.status(200).json({ message: "Property updated successfully.", property });
  } catch (error) {
    handleError(res, error, "updateProperty");
  }
};

const deleteProperty = async (req, res) => {
  try {
    await propertyService.deleteProperty(req.params.id, req.user);
    res.status(200).json({ message: "Property deleted successfully." });
  } catch (error) {
    handleError(res, error, "deleteProperty");
  }
};

const updatePropertyStatus = async (req, res) => {
  try {
    const property = await propertyService.updatePropertyStatus(req.params.id, req.body.status, req.user);
    res.status(200).json({ message: "Property status updated successfully.", property });
  } catch (error) {
    handleError(res, error, "updatePropertyStatus");
  }
};

const getSimilarProperties = async (req, res) => {
  try {
    const properties = await propertyService.getSimilarProperties(req.params.id);
    res.status(200).json({ properties });
  } catch (error) {
    handleError(res, error, "getSimilarProperties");
  }
};

const trackPropertyView = async (req, res) => {
  try {
    const property = await propertyService.trackPropertyView(req.params.id, {
      user_id: req.user?.id || null,
      ip_address: req.ip,
      user_agent: req.get("user-agent") || null,
      source: req.body?.source || "track_view_endpoint",
    });
    res.status(200).json({ message: "Property view tracked.", property });
  } catch (error) {
    handleError(res, error, "trackPropertyView");
  }
};

module.exports = {
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
};

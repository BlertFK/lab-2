const viewingService = require("../services/viewingService");
const {
  validateCreateViewing,
  validateViewingStatus,
} = require("../validators/viewingValidator");

const handleError = (res, error) => {
  console.error("Viewing error:", error.message);
  res.status(error.statusCode || 500).json({
    message: error.statusCode ? error.message : "Server error. Please try again.",
  });
};

const createViewing = async (req, res) => {
  const errors = validateCreateViewing(req.body);
  if (errors.length) return res.status(400).json({ message: errors[0], errors });

  try {
    const viewing = await viewingService.createViewing(req.body, req.user);
    res.status(201).json({ message: "Viewing requested successfully.", viewing });
  } catch (error) {
    handleError(res, error);
  }
};

const getViewings = async (req, res) => {
  try {
    const viewings = await viewingService.listViewings(req.user);
    res.status(200).json({ viewings });
  } catch (error) {
    handleError(res, error);
  }
};

const getViewingById = async (req, res) => {
  try {
    const viewing = await viewingService.getViewing(req.params.id, req.user);
    res.status(200).json({ viewing });
  } catch (error) {
    handleError(res, error);
  }
};

const updateViewingStatus = async (req, res) => {
  const errors = validateViewingStatus(req.body);
  if (errors.length) return res.status(400).json({ message: errors[0], errors });

  try {
    const viewing = await viewingService.updateViewingStatus(req.params.id, req.body, req.user);
    res.status(200).json({ message: "Viewing status updated.", viewing });
  } catch (error) {
    handleError(res, error);
  }
};

module.exports = {
  createViewing,
  getViewings,
  getViewingById,
  updateViewingStatus,
};


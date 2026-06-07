const agencyService = require("../services/agencyService");
const { validateCreateAgency, validateUpdateAgency } = require("../validators/agencyValidator");

const handleError = (res, error) => {
  console.error("Agency error:", error.message);
  res.status(error.statusCode || 500).json({
    message: error.statusCode ? error.message : "Server error. Please try again.",
  });
};

const createAgency = async (req, res) => {
  const errors = validateCreateAgency(req.body);
  if (errors.length) return res.status(400).json({ message: errors[0], errors });

  try {
    const agency = await agencyService.createAgency(req.body, req.user);
    res.status(201).json({ message: "Agency created successfully.", agency });
  } catch (error) {
    handleError(res, error);
  }
};

const getAgencies = async (req, res) => {
  try {
    const filters = {};
    if (req.query.status) filters.status = req.query.status;

    const agencies = await agencyService.listAgencies(filters);
    res.status(200).json({ agencies });
  } catch (error) {
    handleError(res, error);
  }
};

const getAgency = async (req, res) => {
  try {
    const agency = await agencyService.getAgency(req.params.id);
    res.status(200).json({ agency });
  } catch (error) {
    handleError(res, error);
  }
};

const updateAgency = async (req, res) => {
  const errors = validateUpdateAgency(req.body);
  if (errors.length) return res.status(400).json({ message: errors[0], errors });

  try {
    const agency = await agencyService.updateAgency(req.params.id, req.body, req.user);
    res.status(200).json({ message: "Agency updated successfully.", agency });
  } catch (error) {
    handleError(res, error);
  }
};

const getAgencyWithAgents = async (req, res) => {
  try {
    const data = await agencyService.getAgencyWithAgents(req.params.id);
    res.status(200).json(data);
  } catch (error) {
    handleError(res, error);
  }
};

module.exports = {
  createAgency,
  getAgencies,
  getAgency,
  updateAgency,
  getAgencyWithAgents,
};

const agentService = require("../services/agentService");
const { validateCreateAgent, validateUpdateAgent, validateUpdateStatus } = require("../validators/agentValidator");

const handleError = (res, error) => {
  console.error("Agent error:", error.message);
  res.status(error.statusCode || 500).json({
    message: error.statusCode ? error.message : "Server error. Please try again.",
  });
};

const createAgent = async (req, res) => {
  const errors = validateCreateAgent(req.body);
  if (errors.length) return res.status(400).json({ message: errors[0], errors });

  try {
    const agent = await agentService.createAgent(req.body, req.user);
    res.status(201).json({ message: "Agent created successfully.", agent });
  } catch (error) {
    handleError(res, error);
  }
};

const getAgents = async (req, res) => {
  try {
    const filters = {};
    if (req.query.status) filters.status = req.query.status;
    if (req.query.agency_id) filters.agency_id = req.query.agency_id;
    if (req.query.verified !== undefined) filters.verified = req.query.verified === "true";

    const agents = await agentService.listAgents(filters);
    res.status(200).json({ agents });
  } catch (error) {
    handleError(res, error);
  }
};

const getAgent = async (req, res) => {
  try {
    const agent = await agentService.getAgent(req.params.id);
    res.status(200).json({ agent });
  } catch (error) {
    handleError(res, error);
  }
};

const updateAgent = async (req, res) => {
  const errors = validateUpdateAgent(req.body);
  if (errors.length) return res.status(400).json({ message: errors[0], errors });

  try {
    const agent = await agentService.updateAgent(req.params.id, req.body, req.user);
    res.status(200).json({ message: "Agent updated successfully.", agent });
  } catch (error) {
    handleError(res, error);
  }
};

const updateAgentStatus = async (req, res) => {
  const errors = validateUpdateStatus(req.body);
  if (errors.length) return res.status(400).json({ message: errors[0], errors });

  try {
    const agent = await agentService.updateAgentStatus(req.params.id, req.body.status, req.user);
    res.status(200).json({ message: "Agent status updated successfully.", agent });
  } catch (error) {
    handleError(res, error);
  }
};

const getAgentsByAgency = async (req, res) => {
  try {
    const filters = {};
    if (req.query.status) filters.status = req.query.status;

    const agents = await agentService.getAgentsByAgency(req.params.agencyId, filters);
    res.status(200).json({ agents });
  } catch (error) {
    handleError(res, error);
  }
};

module.exports = {
  createAgent,
  getAgents,
  getAgent,
  updateAgent,
  updateAgentStatus,
  getAgentsByAgency,
};

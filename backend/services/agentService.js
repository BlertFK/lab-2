const agentRepository = require("../repositories/agentRepository");
const agencyRepository = require("../repositories/agencyRepository");
const db = require("../config/db");

const createAgent = async (body, user) => {
  if (!body.user_id || !body.license_number) {
    const error = new Error("user_id and license_number are required.");
    error.statusCode = 400;
    throw error;
  }

  const [userRows] = await db.query("SELECT id FROM users WHERE id = ?", [body.user_id]);
  if (!userRows.length) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }

  const existingAgent = await agentRepository.findByUserId(body.user_id);
  if (existingAgent) {
    const error = new Error("This user is already registered as an agent.");
    error.statusCode = 409;
    throw error;
  }

  if (body.agency_id) {
    const agency = await agencyRepository.findById(body.agency_id);
    if (!agency) {
      const error = new Error("Agency not found.");
      error.statusCode = 404;
      throw error;
    }
  }

  const id = await agentRepository.create({
    user_id: body.user_id,
    agency_id: body.agency_id || null,
    license_number: body.license_number,
    specialization: body.specialization,
    phone: body.phone,
    bio: body.bio,
    profile_image_url: body.profile_image_url,
    commission_rate: body.commission_rate || 5.0,
    verified: body.verified || false,
    status: body.status || "active",
    created_by: user.id,
    updated_by: user.id,
  });

  return agentRepository.findById(id);
};

const listAgents = async (filters = {}) => {
  return agentRepository.findAll(filters);
};

const getAgent = async (id) => {
  const agent = await agentRepository.findById(id);
  if (!agent) {
    const error = new Error("Agent not found.");
    error.statusCode = 404;
    throw error;
  }

  return agent;
};

const updateAgent = async (id, body, user) => {
  const agent = await getAgent(id);

  if (body.agency_id && body.agency_id !== agent.agency_id) {
    const agency = await agencyRepository.findById(body.agency_id);
    if (!agency) {
      const error = new Error("Agency not found.");
      error.statusCode = 404;
      throw error;
    }
  }

  await agentRepository.update(id, {
    agency_id: body.agency_id,
    license_number: body.license_number,
    specialization: body.specialization,
    phone: body.phone,
    bio: body.bio,
    profile_image_url: body.profile_image_url,
    commission_rate: body.commission_rate,
    verified: body.verified,
    status: body.status,
    updated_by: user.id,
  });

  return agentRepository.findById(id);
};

const updateAgentStatus = async (id, status, user) => {
  const agent = await getAgent(id);

  const validStatuses = ["active", "inactive", "suspended"];
  if (!validStatuses.includes(status)) {
    const error = new Error(`Status must be one of: ${validStatuses.join(", ")}.`);
    error.statusCode = 400;
    throw error;
  }

  await agentRepository.updateStatus(id, status, user.id);
  return agentRepository.findById(id);
};

const getAgentsByAgency = async (agencyId, filters = {}) => {
  const agency = await agencyRepository.findById(agencyId);
  if (!agency) {
    const error = new Error("Agency not found.");
    error.statusCode = 404;
    throw error;
  }

  return agentRepository.findByAgency(agencyId, filters);
};

module.exports = {
  createAgent,
  listAgents,
  getAgent,
  updateAgent,
  updateAgentStatus,
  getAgentsByAgency,
};

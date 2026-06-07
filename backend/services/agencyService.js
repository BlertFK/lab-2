const agencyRepository = require("../repositories/agencyRepository");
const agentRepository = require("../repositories/agentRepository");

const createAgency = async (body, user) => {
  if (!body.name || !body.email || !body.license_number) {
    const error = new Error("name, email, and license_number are required.");
    error.statusCode = 400;
    throw error;
  }

  const existingEmail = await agencyRepository.findByEmail(body.email);
  if (existingEmail) {
    const error = new Error("An agency with this email already exists.");
    error.statusCode = 409;
    throw error;
  }

  const existingLicense = await agencyRepository.findByLicenseNumber(body.license_number);
  if (existingLicense) {
    const error = new Error("An agency with this license number already exists.");
    error.statusCode = 409;
    throw error;
  }

  const id = await agencyRepository.create({
    name: body.name,
    email: body.email,
    phone: body.phone,
    address: body.address,
    city: body.city,
    state_province: body.state_province,
    postal_code: body.postal_code,
    country: body.country,
    website: body.website,
    license_number: body.license_number,
    founded_year: body.founded_year,
    description: body.description,
    logo_url: body.logo_url,
    status: body.status || "active",
    created_by: user.id,
    updated_by: user.id,
  });

  return agencyRepository.findById(id);
};

const listAgencies = async (filters = {}) => {
  return agencyRepository.findAll(filters);
};

const getAgency = async (id) => {
  const agency = await agencyRepository.findById(id);
  if (!agency) {
    const error = new Error("Agency not found.");
    error.statusCode = 404;
    throw error;
  }

  return agency;
};

const updateAgency = async (id, body, user) => {
  const agency = await getAgency(id);

  if (body.email && body.email !== agency.email) {
    const existing = await agencyRepository.findByEmail(body.email);
    if (existing) {
      const error = new Error("An agency with this email already exists.");
      error.statusCode = 409;
      throw error;
    }
  }

  if (body.license_number && body.license_number !== agency.license_number) {
    const existing = await agencyRepository.findByLicenseNumber(body.license_number);
    if (existing) {
      const error = new Error("An agency with this license number already exists.");
      error.statusCode = 409;
      throw error;
    }
  }

  await agencyRepository.update(id, {
    name: body.name,
    email: body.email,
    phone: body.phone,
    address: body.address,
    city: body.city,
    state_province: body.state_province,
    postal_code: body.postal_code,
    country: body.country,
    website: body.website,
    founded_year: body.founded_year,
    description: body.description,
    logo_url: body.logo_url,
    status: body.status,
    updated_by: user.id,
  });

  return agencyRepository.findById(id);
};

const getAgencyWithAgents = async (id) => {
  const agency = await getAgency(id);
  const agents = await agentRepository.findByAgency(id);

  return {
    ...agency,
    agents,
    agentCount: agents.length,
  };
};

module.exports = {
  createAgency,
  listAgencies,
  getAgency,
  updateAgency,
  getAgencyWithAgents,
};

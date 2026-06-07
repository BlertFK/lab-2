const isPositiveInteger = (value) => Number.isInteger(Number(value)) && Number(value) > 0;

const validateCreateAgent = (body) => {
  const errors = [];

  if (!isPositiveInteger(body.user_id)) {
    errors.push("user_id is required and must be a valid user id.");
  }

  if (!body.license_number || typeof body.license_number !== "string" || body.license_number.trim().length === 0) {
    errors.push("license_number is required and must be a non-empty string.");
  }

  if (body.agency_id && !isPositiveInteger(body.agency_id)) {
    errors.push("agency_id must be a valid agency id.");
  }

  if (body.phone && !/^[\d\s\-\+\(\)]+$/.test(body.phone)) {
    errors.push("phone must be a valid phone number.");
  }

  if (body.commission_rate && (Number(body.commission_rate) < 0 || Number(body.commission_rate) > 100)) {
    errors.push("commission_rate must be between 0 and 100.");
  }

  return errors;
};

const validateUpdateAgent = (body) => {
  const errors = [];

  if (body.agency_id && !isPositiveInteger(body.agency_id)) {
    errors.push("agency_id must be a valid agency id.");
  }

  if (body.phone && !/^[\d\s\-\+\(\)]+$/.test(body.phone)) {
    errors.push("phone must be a valid phone number.");
  }

  if (body.commission_rate && (Number(body.commission_rate) < 0 || Number(body.commission_rate) > 100)) {
    errors.push("commission_rate must be between 0 and 100.");
  }

  if (body.status && !["active", "inactive", "suspended"].includes(body.status)) {
    errors.push("status must be one of: active, inactive, suspended.");
  }

  return errors;
};

const validateUpdateStatus = (body) => {
  const errors = [];

  if (!body.status || !["active", "inactive", "suspended"].includes(body.status)) {
    errors.push("status must be one of: active, inactive, suspended.");
  }

  return errors;
};

module.exports = {
  validateCreateAgent,
  validateUpdateAgent,
  validateUpdateStatus,
};

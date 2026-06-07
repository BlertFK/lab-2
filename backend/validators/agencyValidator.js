const validateCreateAgency = (body) => {
  const errors = [];

  if (!body.name || typeof body.name !== "string" || body.name.trim().length === 0) {
    errors.push("name is required and must be a non-empty string.");
  }

  if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    errors.push("email is required and must be a valid email address.");
  }

  if (!body.license_number || typeof body.license_number !== "string" || body.license_number.trim().length === 0) {
    errors.push("license_number is required and must be a non-empty string.");
  }

  if (body.phone && !/^[\d\s\-\+\(\)]+$/.test(body.phone)) {
    errors.push("phone must be a valid phone number.");
  }

  if (body.founded_year && (!Number.isInteger(Number(body.founded_year)) || Number(body.founded_year) < 1800 || Number(body.founded_year) > new Date().getFullYear())) {
    errors.push("founded_year must be a valid year between 1800 and current year.");
  }

  return errors;
};

const validateUpdateAgency = (body) => {
  const errors = [];

  if (body.name && (typeof body.name !== "string" || body.name.trim().length === 0)) {
    errors.push("name must be a non-empty string.");
  }

  if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    errors.push("email must be a valid email address.");
  }

  if (body.phone && !/^[\d\s\-\+\(\)]+$/.test(body.phone)) {
    errors.push("phone must be a valid phone number.");
  }

  if (body.founded_year && (!Number.isInteger(Number(body.founded_year)) || Number(body.founded_year) < 1800 || Number(body.founded_year) > new Date().getFullYear())) {
    errors.push("founded_year must be a valid year between 1800 and current year.");
  }

  if (body.status && !["active", "inactive", "suspended"].includes(body.status)) {
    errors.push("status must be one of: active, inactive, suspended.");
  }

  return errors;
};

module.exports = {
  validateCreateAgency,
  validateUpdateAgency,
};

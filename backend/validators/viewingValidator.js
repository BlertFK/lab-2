const isPositiveInteger = (value) => Number.isInteger(Number(value)) && Number(value) > 0;

const validateCreateViewing = (body) => {
  const errors = [];

  if (!isPositiveInteger(body.property_id)) errors.push("property_id must be a valid property id.");
  if (!body.scheduled_at || Number.isNaN(Date.parse(body.scheduled_at))) {
    errors.push("scheduled_at must be a valid date.");
  }
  if (body.duration_minutes && !isPositiveInteger(body.duration_minutes)) {
    errors.push("duration_minutes must be a positive number.");
  }

  return errors;
};

const validateViewingStatus = (body) => {
  const allowedStatuses = ["confirmed", "rejected", "completed", "cancelled"];
  const errors = [];

  if (!allowedStatuses.includes(body.status)) {
    errors.push(`status must be one of: ${allowedStatuses.join(", ")}.`);
  }
  if (body.status === "cancelled" && !body.cancelled_reason) {
    errors.push("cancelled_reason is required when cancelling a viewing.");
  }

  return errors;
};

module.exports = {
  validateCreateViewing,
  validateViewingStatus,
};


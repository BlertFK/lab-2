const isPositiveInteger = (value) => Number.isInteger(Number(value)) && Number(value) > 0;
const isPositiveAmount = (value) => Number(value) > 0;

const validateCreateOffer = (body) => {
  const errors = [];

  if (!isPositiveInteger(body.property_id)) errors.push("property_id must be a valid property id.");
  if (!isPositiveAmount(body.amount)) errors.push("amount must be greater than 0.");
  if (body.currency && !/^[A-Z]{3}$/.test(body.currency)) {
    errors.push("currency must be a 3-letter ISO code.");
  }
  if (body.expires_at && Number.isNaN(Date.parse(body.expires_at))) {
    errors.push("expires_at must be a valid date.");
  }

  return errors;
};

const validateOfferStatus = (body) => {
  const allowedStatuses = ["accepted", "rejected", "withdrawn", "expired"];
  const errors = [];

  if (!allowedStatuses.includes(body.status)) {
    errors.push(`status must be one of: ${allowedStatuses.join(", ")}.`);
  }

  return errors;
};

const validateCounterOffer = (body) => {
  const errors = [];

  if (!isPositiveAmount(body.amount)) errors.push("amount must be greater than 0.");
  if (body.currency && !/^[A-Z]{3}$/.test(body.currency)) {
    errors.push("currency must be a 3-letter ISO code.");
  }

  return errors;
};

module.exports = {
  validateCreateOffer,
  validateOfferStatus,
  validateCounterOffer,
};


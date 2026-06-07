const validateTransactionStatus = (body) => {
  const allowedStatuses = ["pending", "in_progress", "completed", "cancelled", "refunded"];
  const errors = [];

  if (!allowedStatuses.includes(body.status)) {
    errors.push(`status must be one of: ${allowedStatuses.join(", ")}.`);
  }

  const allowedPaymentMethods = ["cash", "bank_transfer", "escrow", "crypto"];
  if (body.payment_method && !allowedPaymentMethods.includes(body.payment_method)) {
    errors.push(`payment_method must be one of: ${allowedPaymentMethods.join(", ")}.`);
  }

  return errors;
};

module.exports = {
  validateTransactionStatus,
};


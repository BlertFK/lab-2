const isPositiveInteger = (value) => Number.isInteger(Number(value)) && Number(value) > 0;

const validateCreateReview = (body) => {
  const errors = [];
  const rating = Number(body.rating);

  if (!isPositiveInteger(body.property_id)) errors.push("property_id must be a valid property id.");
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    errors.push("rating must be an integer from 1 to 5.");
  }
  if (!body.comment || body.comment.trim() === "") {
    errors.push("comment is required.");
  }

  return errors;
};

module.exports = {
  validateCreateReview,
};


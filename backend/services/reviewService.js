const reviewRepository = require("../repositories/reviewRepository");

const createReview = async (body, user) => {
  if (user.role !== "buyer") {
    const error = new Error("Only buyers can review properties.");
    error.statusCode = 403;
    throw error;
  }

  const transaction = await reviewRepository.findCompletedTransaction(body.property_id, user.id);
  if (!transaction) {
    const error = new Error("You can only review properties after a completed transaction.");
    error.statusCode = 403;
    throw error;
  }

  const id = await reviewRepository.create({
    property_id: Number(body.property_id),
    user_id: user.id,
    transaction_id: transaction.id,
    rating: Number(body.rating),
    title: body.title,
    comment: body.comment.trim(),
    is_verified: true,
    is_hidden: false,
  });

  return reviewRepository.findById(id);
};

const listPropertyReviews = (propertyId, user) => {
  const includeHidden = user?.role === "admin";
  return reviewRepository.listByProperty(propertyId, includeHidden);
};

const hideReview = async (id, isHidden, user) => {
  if (user.role !== "admin") {
    const error = new Error("Only admins can moderate reviews.");
    error.statusCode = 403;
    throw error;
  }

  const affectedRows = await reviewRepository.setHidden(id, isHidden);
  if (!affectedRows) {
    const error = new Error("Review not found.");
    error.statusCode = 404;
    throw error;
  }

  return reviewRepository.findById(id);
};

module.exports = {
  createReview,
  listPropertyReviews,
  hideReview,
};


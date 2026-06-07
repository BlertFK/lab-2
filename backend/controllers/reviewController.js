const reviewService = require("../services/reviewService");
const { validateCreateReview } = require("../validators/reviewValidator");

const handleError = (res, error) => {
  console.error("Review error:", error.message);
  res.status(error.statusCode || 500).json({
    message: error.statusCode ? error.message : "Server error. Please try again.",
  });
};

const createReview = async (req, res) => {
  const errors = validateCreateReview(req.body);
  if (errors.length) return res.status(400).json({ message: errors[0], errors });

  try {
    const review = await reviewService.createReview(req.body, req.user);
    res.status(201).json({ message: "Review created successfully.", review });
  } catch (error) {
    handleError(res, error);
  }
};

const getPropertyReviews = async (req, res) => {
  try {
    const reviews = await reviewService.listPropertyReviews(req.params.propertyId, req.user);
    res.status(200).json({ reviews });
  } catch (error) {
    handleError(res, error);
  }
};

const hideReview = async (req, res) => {
  try {
    const review = await reviewService.hideReview(req.params.id, true, req.user);
    res.status(200).json({ message: "Review hidden.", review });
  } catch (error) {
    handleError(res, error);
  }
};

const unhideReview = async (req, res) => {
  try {
    const review = await reviewService.hideReview(req.params.id, false, req.user);
    res.status(200).json({ message: "Review unhidden.", review });
  } catch (error) {
    handleError(res, error);
  }
};

module.exports = {
  createReview,
  getPropertyReviews,
  hideReview,
  unhideReview,
};


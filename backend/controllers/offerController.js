const offerService = require("../services/offerService");
const {
  validateCreateOffer,
  validateOfferStatus,
  validateCounterOffer,
} = require("../validators/offerValidator");

const handleError = (res, error) => {
  console.error("Offer error:", error.message);
  res.status(error.statusCode || 500).json({
    message: error.statusCode ? error.message : "Server error. Please try again.",
  });
};

const createOffer = async (req, res) => {
  const errors = validateCreateOffer(req.body);
  if (errors.length) return res.status(400).json({ message: errors[0], errors });

  try {
    const offer = await offerService.createOffer(req.body, req.user);
    res.status(201).json({ message: "Offer created successfully.", offer });
  } catch (error) {
    handleError(res, error);
  }
};

const createCounterOffer = async (req, res) => {
  const errors = validateCounterOffer(req.body);
  if (errors.length) return res.status(400).json({ message: errors[0], errors });

  try {
    const offer = await offerService.createCounterOffer(req.params.id, req.body, req.user);
    res.status(201).json({ message: "Counter-offer created successfully.", offer });
  } catch (error) {
    handleError(res, error);
  }
};

const getOffers = async (req, res) => {
  try {
    const offers = await offerService.listOffers(req.user);
    res.status(200).json({ offers });
  } catch (error) {
    handleError(res, error);
  }
};

const getOfferById = async (req, res) => {
  try {
    const offer = await offerService.getOffer(req.params.id, req.user);
    res.status(200).json({ offer });
  } catch (error) {
    handleError(res, error);
  }
};

const updateOfferStatus = async (req, res) => {
  const errors = validateOfferStatus(req.body);
  if (errors.length) return res.status(400).json({ message: errors[0], errors });

  try {
    const offer = await offerService.updateOfferStatus(req.params.id, req.body.status, req.user);
    res.status(200).json({ message: "Offer status updated.", offer });
  } catch (error) {
    handleError(res, error);
  }
};

module.exports = {
  createOffer,
  createCounterOffer,
  getOffers,
  getOfferById,
  updateOfferStatus,
};


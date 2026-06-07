const db = require("../config/db");
const offerRepository = require("../repositories/offerRepository");
const transactionRepository = require("../repositories/transactionRepository");

const getProperty = async (propertyId) => {
  const [rows] = await db.query("SELECT id, seller_id, agent_id, status FROM properties WHERE id = ?", [propertyId]);
  return rows[0] || null;
};

const assertCanSeeOffer = (offer, user) => {
  if (user.role === "admin") return;
  if (user.role === "buyer" && offer.buyer_id === user.id) return;
  if (user.role === "seller" && offer.seller_id === user.id) return;

  const error = new Error("You do not have access to this offer.");
  error.statusCode = 403;
  throw error;
};

const createOffer = async (body, user) => {
  if (user.role !== "buyer") {
    const error = new Error("Only buyers can create offers.");
    error.statusCode = 403;
    throw error;
  }

  const property = await getProperty(body.property_id);
  if (!property) {
    const error = new Error("Property not found.");
    error.statusCode = 404;
    throw error;
  }
  if (property.status !== "available") {
    const error = new Error("Only available properties can receive offers.");
    error.statusCode = 400;
    throw error;
  }
  if (property.seller_id === user.id) {
    const error = new Error("You cannot make an offer on your own property.");
    error.statusCode = 400;
    throw error;
  }

  const id = await offerRepository.create({
    property_id: Number(body.property_id),
    buyer_id: user.id,
    seller_id: property.seller_id,
    amount: Number(body.amount),
    currency: body.currency || "EUR",
    message: body.message,
    expires_at: body.expires_at,
    created_by: user.id,
    updated_by: user.id,
  });

  return offerRepository.findById(id);
};

const createCounterOffer = async (offerId, body, user) => {
  const original = await offerRepository.findById(offerId);
  if (!original) {
    const error = new Error("Offer not found.");
    error.statusCode = 404;
    throw error;
  }

  if (user.role !== "seller" || original.seller_id !== user.id) {
    const error = new Error("Only the seller can create a counter-offer.");
    error.statusCode = 403;
    throw error;
  }

  const id = await offerRepository.create({
    property_id: original.property_id,
    buyer_id: original.buyer_id,
    seller_id: original.seller_id,
    amount: Number(body.amount),
    currency: body.currency || original.currency || "EUR",
    message: body.message,
    status: "countered",
    counter_offer_id: original.id,
    expires_at: body.expires_at,
    created_by: user.id,
    updated_by: user.id,
  });

  await offerRepository.updateStatus(original.id, "countered", user.id);
  return offerRepository.findById(id);
};

const listOffers = (user) => offerRepository.listForUser(user);

const getOffer = async (id, user) => {
  const offer = await offerRepository.findById(id);
  if (!offer) {
    const error = new Error("Offer not found.");
    error.statusCode = 404;
    throw error;
  }

  assertCanSeeOffer(offer, user);
  return offer;
};

const updateOfferStatus = async (id, status, user) => {
  const offer = await getOffer(id, user);

  if (status === "accepted" || status === "rejected") {
    if (user.role !== "seller" || offer.seller_id !== user.id) {
      const error = new Error("Only the seller can accept or reject offers.");
      error.statusCode = 403;
      throw error;
    }
  }

  if (status === "withdrawn" && (user.role !== "buyer" || offer.buyer_id !== user.id)) {
    const error = new Error("Only the buyer can withdraw an offer.");
    error.statusCode = 403;
    throw error;
  }

  if (status === "accepted") {
    const existingTransaction = await transactionRepository.findByOfferId(offer.id);
    if (!existingTransaction) {
      const property = await getProperty(offer.property_id);
      await transactionRepository.create({
        offer_id: offer.id,
        property_id: offer.property_id,
        buyer_id: offer.buyer_id,
        seller_id: offer.seller_id,
        agent_id: property?.agent_id || null,
        amount: offer.amount,
        status: "pending",
        created_by: user.id,
        updated_by: user.id,
      });
    }
  }

  await offerRepository.updateStatus(id, status, user.id);
  return offerRepository.findById(id);
};

module.exports = {
  createOffer,
  createCounterOffer,
  listOffers,
  getOffer,
  updateOfferStatus,
};


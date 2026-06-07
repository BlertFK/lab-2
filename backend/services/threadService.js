const db = require("../config/db");
const threadRepository = require("../repositories/threadRepository");

const toPositiveInt = (value) => {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
};

const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const getUser = async (id) => {
  const [rows] = await db.query("SELECT id, role FROM users WHERE id = ?", [id]);
  return rows[0] || null;
};

const getProperty = async (id) => {
  const [rows] = await db.query("SELECT id, seller_id FROM properties WHERE id = ?", [id]);
  return rows[0] || null;
};

const assertParticipant = (thread, user) => {
  if (thread.buyer_id === user.id || thread.seller_id === user.id) return;
  throw createError("You do not have access to this thread.", 403);
};

const listThreads = (user) => threadRepository.listForUser(user);

const createOrGetThread = async (body, user) => {
  if (user.role !== "buyer") {
    throw createError("Only buyers can create message threads.", 403);
  }

  const sellerId = toPositiveInt(body.seller_id);
  if (!sellerId) {
    throw createError("seller_id is required.");
  }

  if (sellerId === user.id) {
    throw createError("You cannot create a thread with yourself.");
  }

  const seller = await getUser(sellerId);
  if (!seller || seller.role !== "seller") {
    throw createError("Seller not found.", 404);
  }

  let propertyId = null;
  if (body.property_id !== null && body.property_id !== undefined && body.property_id !== "") {
    propertyId = toPositiveInt(body.property_id);
    if (!propertyId) {
      throw createError("property_id must be valid.");
    }

    const property = await getProperty(propertyId);
    if (!property) {
      throw createError("Property not found.", 404);
    }
    if (property.seller_id !== sellerId) {
      throw createError("seller_id must match the property seller.");
    }
  }

  const existing = await threadRepository.findByParticipants(user.id, sellerId, propertyId);
  if (existing) return existing;

  const id = await threadRepository.create({
    property_id: propertyId,
    buyer_id: user.id,
    seller_id: sellerId,
  });

  return threadRepository.findById(id);
};

const getThreadForUser = async (threadId, user) => {
  const id = toPositiveInt(threadId);
  if (!id) {
    throw createError("thread_id must be valid.");
  }

  const thread = await threadRepository.findById(id);
  if (!thread) {
    throw createError("Thread not found.", 404);
  }

  assertParticipant(thread, user);
  return thread;
};

module.exports = {
  toPositiveInt,
  assertParticipant,
  listThreads,
  createOrGetThread,
  getThreadForUser,
};

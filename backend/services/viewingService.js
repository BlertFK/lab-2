const db = require("../config/db");
const viewingRepository = require("../repositories/viewingRepository");
const notifyService = require("./notifyService");
const socketService = require("./socketService");

const getProperty = async (propertyId) => {
  const [rows] = await db.query("SELECT id, seller_id, status FROM properties WHERE id = ?", [propertyId]);
  return rows[0] || null;
};

const assertCanSeeViewing = (viewing, user) => {
  if (user.role === "admin") return;
  if (user.role === "buyer" && viewing.buyer_id === user.id) return;
  if (user.role === "seller" && viewing.seller_id === user.id) return;

  const error = new Error("You do not have access to this viewing.");
  error.statusCode = 403;
  throw error;
};

const createViewing = async (body, user) => {
  if (user.role !== "buyer") {
    const error = new Error("Only buyers can request viewings.");
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
    const error = new Error("Only available properties can be scheduled for viewing.");
    error.statusCode = 400;
    throw error;
  }
  if (property.seller_id === user.id) {
    const error = new Error("You cannot request a viewing for your own property.");
    error.statusCode = 400;
    throw error;
  }

  const id = await viewingRepository.create({
    property_id: Number(body.property_id),
    buyer_id: user.id,
    seller_id: property.seller_id,
    scheduled_at: body.scheduled_at,
    duration_minutes: body.duration_minutes ? Number(body.duration_minutes) : 30,
    status: "requested",
    notes: body.notes,
    created_by: user.id,
    updated_by: user.id,
  });

  const viewing = await viewingRepository.findById(id);
  const payload = { viewing };
  socketService.emitToUsers([viewing.buyer_id, viewing.seller_id], "viewing:scheduled", payload);
  await notifyService.createNotification({
    user_id: viewing.seller_id,
    type: "viewing_scheduled",
    title: "New viewing scheduled",
    message: `${viewing.buyer_name || "A buyer"} requested a viewing for ${viewing.property_title || "your property"}.`,
    link: "/dashboard",
    payload,
  });

  return viewing;
};

const listViewings = (user) => viewingRepository.listForUser(user);

const getViewing = async (id, user) => {
  const viewing = await viewingRepository.findById(id);
  if (!viewing) {
    const error = new Error("Viewing not found.");
    error.statusCode = 404;
    throw error;
  }

  assertCanSeeViewing(viewing, user);
  return viewing;
};

const updateViewingStatus = async (id, body, user) => {
  const viewing = await getViewing(id, user);

  if (body.status === "confirmed" || body.status === "rejected") {
    if (user.role !== "seller" || viewing.seller_id !== user.id) {
      const error = new Error("Only the seller can confirm or reject a viewing.");
      error.statusCode = 403;
      throw error;
    }
  }

  if (body.status === "completed" && user.role !== "seller" && user.role !== "admin") {
    const error = new Error("Only sellers or admins can mark a viewing completed.");
    error.statusCode = 403;
    throw error;
  }

  await viewingRepository.updateStatus(id, {
    status: body.status,
    cancelled_by: body.status === "cancelled" ? user.id : null,
    cancelled_reason: body.cancelled_reason,
    updated_by: user.id,
  });

  const updatedViewing = await viewingRepository.findById(id);
  const payload = { viewing: updatedViewing };

  if (body.status === "confirmed") {
    socketService.emitToUsers([updatedViewing.buyer_id, updatedViewing.seller_id], "viewing:confirmed", payload);
    await notifyService.createNotification({
      user_id: updatedViewing.buyer_id,
      type: "viewing_confirmed",
      title: "Viewing confirmed",
      message: `Your viewing for ${updatedViewing.property_title || "a property"} was confirmed.`,
      link: "/dashboard",
      payload,
    });
  }

  if (body.status === "cancelled") {
    const recipientId = user.id === updatedViewing.buyer_id ? updatedViewing.seller_id : updatedViewing.buyer_id;
    socketService.emitToUsers([updatedViewing.buyer_id, updatedViewing.seller_id], "viewing:cancelled", payload);
    await notifyService.createNotification({
      user_id: recipientId,
      type: "viewing_cancelled",
      title: "Viewing cancelled",
      message: `The viewing for ${updatedViewing.property_title || "a property"} was cancelled.`,
      link: "/dashboard",
      payload,
    });
  }

  return updatedViewing;
};

module.exports = {
  createViewing,
  listViewings,
  getViewing,
  updateViewingStatus,
};

const propertyRepository = require("../repositories/propertyRepository");
const planService = require("./planService");
const propertyViewLogService = require("./propertyViewLogService");

const CREATE_STATUSES = ["available", "sold", "rented", "draft", "reserved", "archived"];

const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const isSeller = (user) => user?.role === "seller";
const isAdmin = (user) => user?.role === "admin";

const normalizeSlug = (value) => String(value || "")
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "")
  .slice(0, 180);

const buildUniqueSlug = async (title, excludeId = null) => {
  const base = normalizeSlug(title) || `property-${Date.now()}`;
  let slug = base;
  let index = 2;

  while (await propertyRepository.slugExists(slug, excludeId)) {
    slug = `${base}-${index}`;
    index += 1;
  }

  return slug;
};

const nullable = (value) => (value === "" ? null : value);

const assertOwnerOrAdmin = (property, user, action) => {
  if (!property) throw createError("Property not found.", 404);
  if (isAdmin(user)) return;
  if (!isSeller(user)) throw createError(`Only sellers can ${action} properties.`, 403);
  if (property.seller_id !== user.id) throw createError("You do not own this property.", 403);
};

const listProperties = (filters) => propertyRepository.list(filters);

const listMyProperties = (user) => {
  if (!isSeller(user)) {
    throw createError("Only sellers can access this endpoint.", 403);
  }

  return propertyRepository.list({ seller_id: user.id, sort: "newest" });
};

const getPropertyById = async (id) => {
  const property = await propertyRepository.findById(id);
  if (!property) throw createError("Property not found.", 404);
  return property;
};

const getPropertyBySlug = async (slug) => {
  const property = await propertyRepository.findBySlug(slug);
  if (!property) throw createError("Property not found.", 404);
  return property;
};

const createProperty = async (body, user) => {
  if (!isSeller(user)) {
    throw createError("Only sellers can create properties.", 403);
  }

  if (!body.title || !body.price || !body.location || !body.type) {
    throw createError("title, price, location, and type are required.");
  }

  await planService.assertCanCreateListing(user);

  const columns = await propertyRepository.getColumns();
  const status = CREATE_STATUSES.includes(body.status) ? body.status : "available";
  const property = {
    title: body.title,
    description: nullable(body.description),
    price: body.price,
    currency: body.currency || "EUR",
    area_m2: nullable(body.area_m2),
    rooms: nullable(body.rooms),
    bedrooms: nullable(body.bedrooms),
    bathrooms: nullable(body.bathrooms),
    floor: nullable(body.floor),
    total_floors: nullable(body.total_floors),
    year_built: nullable(body.year_built),
    type_id: nullable(body.type_id),
    category_id: nullable(body.category_id),
    location_id: nullable(body.location_id),
    location: body.location,
    type: body.type,
    status,
    image_url: nullable(body.image_url),
    seller_id: user.id,
    agent_id: nullable(body.agent_id),
    agency_id: nullable(body.agency_id),
    published_at: status === "available" && columns.has("published_at") ? new Date() : body.published_at || null,
    created_by: user.id,
    updated_by: user.id,
  };

  if (columns.has("slug")) {
    property.slug = await buildUniqueSlug(body.slug || body.title);
  }

  const id = await propertyRepository.create(property);
  return propertyRepository.findById(id);
};

const updateProperty = async (id, body, user) => {
  const property = await propertyRepository.findById(id);
  assertOwnerOrAdmin(property, user, "update");

  const changes = {};
  [
    "title", "description", "price", "currency", "area_m2", "rooms", "bedrooms",
    "bathrooms", "floor", "total_floors", "year_built", "type_id", "category_id",
    "location_id", "location", "type", "status", "image_url", "agent_id", "agency_id",
    "published_at",
  ].forEach((field) => {
    if (body[field] !== undefined) changes[field] = nullable(body[field]);
  });

  if (body.title !== undefined) changes.title = body.title;
  if (body.price !== undefined) changes.price = body.price;
  if (body.location !== undefined) changes.location = body.location;
  if (body.type !== undefined) changes.type = body.type;
  if (body.status !== undefined) changes.status = body.status;
  if (body.image_url !== undefined) changes.image_url = nullable(body.image_url);
  if (body.slug !== undefined || body.title !== undefined) {
    const columns = await propertyRepository.getColumns();
    if (columns.has("slug")) changes.slug = await buildUniqueSlug(body.slug || body.title || property.title, id);
  }
  changes.updated_by = user.id;

  await propertyRepository.update(id, changes);
  return propertyRepository.findById(id);
};

const deleteProperty = async (id, user) => {
  const property = await propertyRepository.findById(id);
  assertOwnerOrAdmin(property, user, "delete");
  await propertyRepository.remove(id);
};

const updatePropertyStatus = async (id, status, user) => {
  if (!CREATE_STATUSES.includes(status)) {
    throw createError(`status must be one of: ${CREATE_STATUSES.join(", ")}.`);
  }

  const property = await propertyRepository.findById(id);
  assertOwnerOrAdmin(property, user, "update");
  await propertyRepository.updateStatus(id, status, user.id);
  return propertyRepository.findById(id);
};

const getSimilarProperties = async (id) => {
  const property = await getPropertyById(id);
  const filters = { status: "available", sort: "newest" };

  if (property.type_id) filters.type_id = property.type_id;
  else if (property.type) filters.type = property.type;
  if (property.category_id) filters.category_id = property.category_id;
  if (property.location_id) filters.location_id = property.location_id;

  const properties = await propertyRepository.list(filters);
  return properties.filter((item) => item.id !== property.id).slice(0, 6);
};

const trackPropertyView = async (id, context = {}) => {
  const property = await getPropertyById(id);
  await propertyRepository.incrementViews(id);
  await propertyViewLogService.createPropertyViewLog({
    property_id: id,
    user_id: context.user_id,
    ip_address: context.ip_address,
    user_agent: context.user_agent,
    source: context.source || "track_view_endpoint",
  });
  return propertyRepository.findById(id) || property;
};

module.exports = {
  listProperties,
  listMyProperties,
  getPropertyById,
  getPropertyBySlug,
  createProperty,
  updateProperty,
  deleteProperty,
  updatePropertyStatus,
  getSimilarProperties,
  trackPropertyView,
};

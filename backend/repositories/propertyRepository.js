const db = require("../config/db");
const BaseRepository = require("./BaseRepository");

const BASE_SELECT = `
  SELECT p.*, u.name AS seller_name, u.email AS seller_email
  FROM properties p
  LEFT JOIN users u ON p.seller_id = u.id
`;

let cachedColumns = null;

class PropertyRepository extends BaseRepository {
  constructor() {
    super("properties", db);
  }
}

const propertyRepository = new PropertyRepository();

propertyRepository.getColumns = async () => {
  if (cachedColumns) return cachedColumns;

  const [rows] = await db.query(
    `SELECT COLUMN_NAME
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties'`
  );

  cachedColumns = new Set(rows.map((row) => row.COLUMN_NAME));
  return cachedColumns;
};

propertyRepository.resetColumnCache = () => {
  cachedColumns = null;
};

const addFilter = (parts, params, condition, value) => {
  if (value === undefined || value === null || value === "") return;
  parts.push(condition);
  params.push(value);
};

propertyRepository.list = async (filters = {}) => {
  const columns = await propertyRepository.getColumns();
  const where = ["1=1"];
  const params = [];
  const joins = [];

  if (filters.city_id && columns.has("location_id")) {
    joins.push("LEFT JOIN locations l ON l.id = p.location_id");
    addFilter(where, params, "l.city_id = ?", filters.city_id);
  }

  if (filters.search) {
    where.push("(p.title LIKE ? OR p.location LIKE ? OR p.description LIKE ?)");
    params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
  }

  addFilter(where, params, "p.type = ?", filters.type);
  if (columns.has("type_id")) addFilter(where, params, "p.type_id = ?", filters.type_id);
  if (columns.has("category_id")) addFilter(where, params, "p.category_id = ?", filters.category_id);
  if (columns.has("location_id")) addFilter(where, params, "p.location_id = ?", filters.location_id);
  addFilter(where, params, "p.status = ?", filters.status);
  addFilter(where, params, "p.price >= ?", filters.min_price ?? filters.minPrice);
  addFilter(where, params, "p.price <= ?", filters.max_price ?? filters.maxPrice);
  addFilter(where, params, "p.seller_id = ?", filters.seller_id);

  const sort = filters.sort || "newest";
  const orderBy = {
    newest: "p.created_at DESC",
    price_asc: "p.price ASC",
    price_desc: "p.price DESC",
  }[sort] || "p.created_at DESC";

  const [rows] = await db.query(
    `${BASE_SELECT}
     ${joins.join(" ")}
     WHERE ${where.join(" AND ")}
     ORDER BY ${orderBy}`,
    params
  );

  return rows;
};

propertyRepository.findById = async (id) => {
  const [rows] = await db.query(`${BASE_SELECT} WHERE p.id = ?`, [id]);
  return rows[0] || null;
};

propertyRepository.findBySlug = async (slug) => {
  const columns = await propertyRepository.getColumns();
  if (!columns.has("slug")) return null;

  const [rows] = await db.query(`${BASE_SELECT} WHERE p.slug = ?`, [slug]);
  return rows[0] || null;
};

propertyRepository.slugExists = async (slug, excludeId = null) => {
  const columns = await propertyRepository.getColumns();
  if (!columns.has("slug")) return false;

  const params = [slug];
  let query = "SELECT id FROM properties WHERE slug = ?";
  if (excludeId) {
    query += " AND id <> ?";
    params.push(excludeId);
  }

  const [rows] = await db.query(query, params);
  return rows.length > 0;
};

propertyRepository.create = async (property) => {
  const columns = await propertyRepository.getColumns();
  const allowed = [
    "title", "slug", "description", "price", "currency", "area_m2", "rooms", "bedrooms",
    "bathrooms", "floor", "total_floors", "year_built", "type_id", "category_id",
    "location_id", "location", "type", "status", "image_url", "seller_id", "agent_id",
    "agency_id", "published_at", "created_by", "updated_by",
  ];
  const insertColumns = allowed.filter((column) => columns.has(column) && property[column] !== undefined);
  const values = insertColumns.map((column) => property[column]);

  const [result] = await db.query(
    `INSERT INTO properties (${insertColumns.join(", ")})
     VALUES (${insertColumns.map(() => "?").join(", ")})`,
    values
  );

  return result.insertId;
};

propertyRepository.update = async (id, changes) => {
  const columns = await propertyRepository.getColumns();
  const allowed = [
    "title", "slug", "description", "price", "currency", "area_m2", "rooms", "bedrooms",
    "bathrooms", "floor", "total_floors", "year_built", "type_id", "category_id",
    "location_id", "location", "type", "status", "image_url", "agent_id", "agency_id",
    "published_at", "updated_by",
  ];
  const updateColumns = allowed.filter((column) => columns.has(column) && changes[column] !== undefined);

  if (updateColumns.length === 0) return 0;

  const assignments = updateColumns.map((column) => `${column} = ?`);
  const values = updateColumns.map((column) => changes[column]);
  values.push(id);

  const [result] = await db.query(
    `UPDATE properties SET ${assignments.join(", ")} WHERE id = ?`,
    values
  );

  return result.affectedRows;
};

propertyRepository.remove = async (id) => {
  const [result] = await db.query("DELETE FROM properties WHERE id = ?", [id]);
  return result.affectedRows;
};

propertyRepository.updateStatus = async (id, status, userId) => {
  const columns = await propertyRepository.getColumns();
  const assignments = ["status = ?"];
  const params = [status];

  if (columns.has("updated_by")) {
    assignments.push("updated_by = ?");
    params.push(userId || null);
  }
  params.push(id);

  const [result] = await db.query(
    `UPDATE properties SET ${assignments.join(", ")} WHERE id = ?`,
    params
  );

  return result.affectedRows;
};

propertyRepository.incrementViews = async (id) => {
  const columns = await propertyRepository.getColumns();
  if (!columns.has("views_count")) return 0;

  const [result] = await db.query(
    "UPDATE properties SET views_count = views_count + 1 WHERE id = ?",
    [id]
  );

  return result.affectedRows;
};

module.exports = propertyRepository;

const db = require("../config/db");

const createProperty = async (req, res) => {
  if (req.user.role !== "seller")
    return res.status(403).json({ message: "Only sellers can create properties." });

  const { title, description, price, location, type, status, image_url } = req.body;
  const seller_id = req.user.id;

  if (!title || !price || !location || !type)
    return res.status(400).json({ message: "title, price, location, and type are required." });

  const allowedStatuses = ["available", "sold", "rented"];
  const resolvedStatus = allowedStatuses.includes(status) ? status : "available";

  try {
    const [result] = await db.query(
      `INSERT INTO properties (title, description, price, location, type, status, image_url, seller_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, description || null, price, location, type, resolvedStatus, image_url || null, seller_id]
    );
    res.status(201).json({ message: "Property created successfully.", propertyId: result.insertId });
  } catch (error) {
    console.error("createProperty error:", error.message);
    res.status(500).json({ message: "Server error. Please try again." });
  }
};

const getMyProperties = async (req, res) => {
  if (req.user.role !== "seller")
    return res.status(403).json({ message: "Only sellers can access this endpoint." });

  try {
    const [rows] = await db.query(
      `SELECT id, title, description, price, location, type, status, image_url, created_at
       FROM properties WHERE seller_id = ? ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.status(200).json({ properties: rows });
  } catch (error) {
    console.error("getMyProperties error:", error.message);
    res.status(500).json({ message: "Server error. Please try again." });
  }
};

const updateProperty = async (req, res) => {
  if (req.user.role !== "seller")
    return res.status(403).json({ message: "Only sellers can update properties." });

  const propertyId = req.params.id;
  const seller_id = req.user.id;

  try {
    const [rows] = await db.query("SELECT seller_id FROM properties WHERE id = ?", [propertyId]);
    if (rows.length === 0) return res.status(404).json({ message: "Property not found." });
    if (rows[0].seller_id !== seller_id) return res.status(403).json({ message: "You do not own this property." });

    const { title, description, price, location, type, status, image_url } = req.body;
    await db.query(
      `UPDATE properties SET title=?, description=?, price=?, location=?, type=?, status=?, image_url=?
       WHERE id=? AND seller_id=?`,
      [title, description || null, price, location, type, status, image_url || null, propertyId, seller_id]
    );
    res.status(200).json({ message: "Property updated successfully." });
  } catch (error) {
    console.error("updateProperty error:", error.message);
    res.status(500).json({ message: "Server error. Please try again." });
  }
};

const deleteProperty = async (req, res) => {
  if (req.user.role !== "seller")
    return res.status(403).json({ message: "Only sellers can delete properties." });

  const propertyId = req.params.id;
  const seller_id = req.user.id;

  try {
    const [rows] = await db.query("SELECT seller_id FROM properties WHERE id = ?", [propertyId]);
    if (rows.length === 0) return res.status(404).json({ message: "Property not found." });
    if (rows[0].seller_id !== seller_id) return res.status(403).json({ message: "You do not own this property." });

    await db.query("DELETE FROM properties WHERE id = ? AND seller_id = ?", [propertyId, seller_id]);
    res.status(200).json({ message: "Property deleted successfully." });
  } catch (error) {
    console.error("deleteProperty error:", error.message);
    res.status(500).json({ message: "Server error. Please try again." });
  }
};

// ── Member 2 — GET all + search ──────────────────────────────
const getAllProperties = async (req, res) => {
  const { search, type, status, minPrice, maxPrice } = req.query;

  let query = `SELECT p.*, u.name as seller_name FROM properties p
               LEFT JOIN users u ON p.seller_id = u.id WHERE 1=1`;
  const params = [];

  if (search) {
    query += ` AND (p.title LIKE ? OR p.location LIKE ? OR p.description LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (type) {
    query += ` AND p.type = ?`;
    params.push(type);
  }
  if (status) {
    query += ` AND p.status = ?`;
    params.push(status);
  }
  if (minPrice) {
    query += ` AND p.price >= ?`;
    params.push(minPrice);
  }
  if (maxPrice) {
    query += ` AND p.price <= ?`;
    params.push(maxPrice);
  }

  query += ` ORDER BY p.created_at DESC`;

  try {
    const [rows] = await db.query(query, params);
    res.status(200).json({ properties: rows });
  } catch (error) {
    console.error("getAllProperties error:", error.message);
    res.status(500).json({ message: "Server error. Please try again." });
  }
};

// ── Member 2 — GET single property by ID ─────────────────────
const getPropertyById = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT p.*, u.name as seller_name, u.email as seller_email
       FROM properties p
       LEFT JOIN users u ON p.seller_id = u.id
       WHERE p.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0)
      return res.status(404).json({ message: "Property not found." });
    res.status(200).json({ property: rows[0] });
  } catch (error) {
    console.error("getPropertyById error:", error.message);
    res.status(500).json({ message: "Server error. Please try again." });
  }
};

module.exports = {
  createProperty,
  getMyProperties,
  updateProperty,
  deleteProperty,
  getAllProperties,
  getPropertyById,
};
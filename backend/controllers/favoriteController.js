const db = require("../config/db");

const getFavorites = async (req, res) => {
  if (req.user.role !== "buyer") {
    return res.status(403).json({ message: "Only buyers can access favorites." });
  }

  try {
    const [rows] = await db.query(
      `SELECT
        f.id AS favorite_id,
        p.id,
        p.title,
        p.description,
        p.price,
        p.location,
        p.type,
        p.status,
        p.image_url,
        p.created_at,
        u.name AS seller_name,
        u.email AS seller_email
      FROM favorites f
      INNER JOIN properties p ON p.id = f.property_id
      LEFT JOIN users u ON u.id = p.seller_id
      WHERE f.buyer_id = ?
      ORDER BY f.id DESC`,
      [req.user.id]
    );

    res.status(200).json({ favorites: rows });
  } catch (error) {
    console.error("getFavorites error:", error.message);
    res.status(500).json({ message: "Server error. Please try again." });
  }
};

const addFavorite = async (req, res) => {
  if (req.user.role !== "buyer") {
    return res.status(403).json({ message: "Only buyers can add favorites." });
  }

  const propertyId = Number(req.params.propertyId);

  if (!propertyId) {
    return res.status(400).json({ message: "Valid property id is required." });
  }

  try {
    const [propertyRows] = await db.query(
      "SELECT id, status FROM properties WHERE id = ?",
      [propertyId]
    );

    if (propertyRows.length === 0) {
      return res.status(404).json({ message: "Property not found." });
    }

    if (propertyRows[0].status !== "available") {
      return res.status(400).json({ message: "Only available properties can be added to favorites." });
    }

    const [existing] = await db.query(
      "SELECT id FROM favorites WHERE buyer_id = ? AND property_id = ?",
      [req.user.id, propertyId]
    );

    if (existing.length > 0) {
      return res.status(409).json({ message: "Property is already in favorites." });
    }

    await db.query(
      "INSERT INTO favorites (buyer_id, property_id) VALUES (?, ?)",
      [req.user.id, propertyId]
    );

    res.status(201).json({ message: "Property added to favorites." });
  } catch (error) {
    console.error("addFavorite error:", error.message);
    res.status(500).json({ message: "Server error. Please try again." });
  }
};

const removeFavorite = async (req, res) => {
  if (req.user.role !== "buyer") {
    return res.status(403).json({ message: "Only buyers can remove favorites." });
  }

  const propertyId = Number(req.params.propertyId);

  if (!propertyId) {
    return res.status(400).json({ message: "Valid property id is required." });
  }

  try {
    const [result] = await db.query(
      "DELETE FROM favorites WHERE buyer_id = ? AND property_id = ?",
      [req.user.id, propertyId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Favorite not found." });
    }

    res.status(200).json({ message: "Property removed from favorites." });
  } catch (error) {
    console.error("removeFavorite error:", error.message);
    res.status(500).json({ message: "Server error. Please try again." });
  }
};

module.exports = { getFavorites, addFavorite, removeFavorite };

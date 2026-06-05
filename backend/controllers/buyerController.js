const db = require("../config/db");

const getBuyerDashboard = async (req, res) => {
  if (req.user.role !== "buyer") {
    return res.status(403).json({ message: "Only buyers can access this endpoint." });
  }

  try {
    const [buyerRows] = await db.query(
      "SELECT id, name, email, role, created_at FROM users WHERE id = ?",
      [req.user.id]
    );

    if (buyerRows.length === 0) {
      return res.status(404).json({ message: "Buyer not found." });
    }

    const [favoriteRows] = await db.query(
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
        u.name AS seller_name
      FROM favorites f
      INNER JOIN properties p ON p.id = f.property_id
      LEFT JOIN users u ON u.id = p.seller_id
      WHERE f.buyer_id = ?
      ORDER BY f.id DESC
      LIMIT 6`,
      [req.user.id]
    );

    const [latestRows] = await db.query(
      `SELECT
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
        EXISTS(
          SELECT 1
          FROM favorites f
          WHERE f.buyer_id = ? AND f.property_id = p.id
        ) AS is_favorite
      FROM properties p
      LEFT JOIN users u ON u.id = p.seller_id
      WHERE p.status = 'available'
      ORDER BY p.created_at DESC
      LIMIT 6`,
      [req.user.id]
    );

    res.status(200).json({
      buyer: buyerRows[0],
      favorites: favoriteRows,
      latestProperties: latestRows.map((property) => ({
        ...property,
        is_favorite: Boolean(property.is_favorite),
      })),
    });
  } catch (error) {
    console.error("getBuyerDashboard error:", error.message);
    res.status(500).json({ message: "Server error. Please try again." });
  }
};

module.exports = { getBuyerDashboard };

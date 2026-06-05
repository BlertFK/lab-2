const db = require("../config/db");

const sendMessage = async (req, res) => {
  if (req.user.role !== "buyer") {
    return res.status(403).json({ message: "Only buyers can send messages." });
  }

  const { property_id, message } = req.body;
  const buyer_id = req.user.id;

  if (!property_id || !message || message.trim() === "") {
    return res.status(400).json({ message: "property_id and message are required." });
  }

  try {
    const [propertyRows] = await db.query(
      "SELECT id, seller_id FROM properties WHERE id = ?",
      [property_id]
    );

    if (propertyRows.length === 0) {
      return res.status(404).json({ message: "Property not found." });
    }

    const seller_id = propertyRows[0].seller_id;

    if (seller_id === buyer_id) {
      return res.status(400).json({ message: "You cannot message yourself." });
    }

    const [result] = await db.query(
      "INSERT INTO messages (buyer_id, seller_id, property_id, message) VALUES (?, ?, ?, ?)",
      [buyer_id, seller_id, property_id, message.trim()]
    );

    res.status(201).json({ message: "Message sent successfully.", messageId: result.insertId });
  } catch (error) {
    console.error("sendMessage error:", error.message);
    res.status(500).json({ message: "Server error. Please try again." });
  }
};

const getSellerMessages = async (req, res) => {
  if (req.user.role !== "seller") {
    return res.status(403).json({ message: "Only sellers can access this endpoint." });
  }

  try {
    const [rows] = await db.query(
      `SELECT
        m.id,
        m.message,
        m.created_at,
        m.property_id,
        p.title AS property_title,
        u.name  AS buyer_name,
        u.email AS buyer_email
      FROM messages m
      LEFT JOIN properties p ON p.id = m.property_id
      LEFT JOIN users u ON u.id = m.buyer_id
      WHERE m.seller_id = ?
      ORDER BY m.created_at DESC`,
      [req.user.id]
    );

    res.status(200).json({ messages: rows });
  } catch (error) {
    console.error("getSellerMessages error:", error.message);
    res.status(500).json({ message: "Server error. Please try again." });
  }
};

module.exports = { sendMessage, getSellerMessages };
const db = require("../config/db");
const threadService = require("../services/threadService");
const messageService = require("../services/messageService");

const handleError = (res, error) => {
  console.error("Message error:", error.message);
  res.status(error.statusCode || 500).json({
    message: error.statusCode ? error.message : "Server error. Please try again.",
  });
};

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

    const thread = await threadService.createOrGetThread(
      {
        seller_id,
        property_id,
      },
      req.user
    );

    const sentMessage = await messageService.sendThreadMessage(
      thread.id,
      {
        body: message,
        attachment_file_id: null,
      },
      req.user
    );

    res.status(201).json({ message: "Message sent successfully.", messageId: sentMessage.id, threadId: thread.id });
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
        COALESCE(m.message, m.body) AS message,
        m.created_at,
        m.property_id,
        m.thread_id,
        m.sender_id,
        m.read_at,
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

const markMessageRead = async (req, res) => {
  try {
    const message = await messageService.markMessageRead(req.params.id, req.user);
    res.status(200).json({ message: "Message marked as read.", data: message });
  } catch (error) {
    handleError(res, error);
  }
};

module.exports = { sendMessage, getSellerMessages, markMessageRead };

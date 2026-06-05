const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
require("dotenv").config();

// ─────────────────────────────────────────────
//  POST /api/auth/register
// ─────────────────────────────────────────────
const register = async (req, res) => {
  const { name, email, password, role } = req.body;

  // 1. Basic input validation
  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: "All fields are required." });
  }

  const allowedRoles = ["admin", "buyer", "seller"];
  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ message: "Role must be admin, buyer, or seller." });
  }

  try {
    // 2. Check if email already exists
    const [existing] = await db.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: "Email is already registered." });
    }

    // 3. Hash the password (salt rounds = 10)
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Insert new user into the database
    const [result] = await db.query(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      [name, email, hashedPassword, role]
    );

    // 5. Respond with success
    res.status(201).json({
      message: "User registered successfully.",
      userId: result.insertId,
    });

  } catch (error) {
    console.error("Register error:", error.message);
    res.status(500).json({ message: "Server error. Please try again." });
  }
};

// ─────────────────────────────────────────────
//  POST /api/auth/login
// ─────────────────────────────────────────────
const login = async (req, res) => {
  const { email, password } = req.body;

  // 1. Basic input validation
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  try {
    // 2. Check if user exists
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    if (rows.length === 0) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const user = rows[0];

    // 3. Compare the provided password with the hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // 4. Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role }, // Payload
      process.env.JWT_SECRET,                               // Secret key
      { expiresIn: process.env.JWT_EXPIRES_IN }            // Expiry
    );

    // 5. Return token and user info (never return the password)
    res.status(200).json({
      message: "Login successful.",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.created_at,
      },
    });

  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({ message: "Server error. Please try again." });
  }
};

// ─────────────────────────────────────────────
//  GET /api/auth/me  (protected route example)
// ─────────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    // req.user is set by the verifyToken middleware
    const [rows] = await db.query(
      "SELECT id, name, email, role, created_at FROM users WHERE id = ?",
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json({ user: rows[0] });

  } catch (error) {
    console.error("GetMe error:", error.message);
    res.status(500).json({ message: "Server error." });
  }
};

module.exports = { register, login, getMe };

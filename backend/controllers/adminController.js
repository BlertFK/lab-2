const db = require("../config/db");

exports.getAllUsers = async (req, res) => {
  const [users] = await db.query("SELECT id, name, email, role, created_at FROM users");
  res.json(users);
};

exports.deleteUser = async (req, res) => {
  await db.query("DELETE FROM users WHERE id = ?", [req.params.id]);
  res.json({ message: "User deleted" });
};

exports.updateUser = async (req, res) => {
  const { name, email, role } = req.body;
  await db.query("UPDATE users SET name=?, email=?, role=? WHERE id=?", [name, email, role, req.params.id]);
  res.json({ message: "User updated" });
};

exports.getAllProperties = async (req, res) => {
  const [props] = await db.query("SELECT * FROM properties");
  res.json(props);
};

exports.deleteProperty = async (req, res) => {
  await db.query("DELETE FROM properties WHERE id = ?", [req.params.id]);
  res.json({ message: "Property deleted" });
};

exports.updateProperty = async (req, res) => {
  const { title, description, price, location, type, status, image_url } = req.body;
  await db.query(
    "UPDATE properties SET title=?, description=?, price=?, location=?, type=?, status=?, image_url=? WHERE id=?",
    [title, description, price, location, type, status, image_url, req.params.id]
  );
  res.json({ message: "Property updated" });
};
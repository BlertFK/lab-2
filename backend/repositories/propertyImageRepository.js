const db = require("../config/db");

const listByProperty = async (propertyId) => {
  const [rows] = await db.query(
    `SELECT id, property_id, file_id, image_url, sort_order, is_primary, caption, created_at
     FROM property_images
     WHERE property_id = ?
     ORDER BY is_primary DESC, sort_order ASC, id ASC`,
    [propertyId]
  );

  return rows;
};

const create = async (propertyId, image) => {
  const [result] = await db.query(
    `INSERT INTO property_images (property_id, file_id, image_url, sort_order, is_primary, caption)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      propertyId,
      image.file_id || null,
      image.image_url || null,
      image.sort_order || 0,
      image.is_primary ? 1 : 0,
      image.caption || null,
    ]
  );

  return result.insertId;
};

const remove = async (propertyId, imageId) => {
  const [result] = await db.query(
    "DELETE FROM property_images WHERE property_id = ? AND id = ?",
    [propertyId, imageId]
  );

  return result.affectedRows;
};

const setPrimary = async (propertyId, imageId) => {
  await db.query("UPDATE property_images SET is_primary = 0 WHERE property_id = ?", [propertyId]);
  const [result] = await db.query(
    "UPDATE property_images SET is_primary = 1 WHERE property_id = ? AND id = ?",
    [propertyId, imageId]
  );

  return result.affectedRows;
};

module.exports = {
  listByProperty,
  create,
  remove,
  setPrimary,
};


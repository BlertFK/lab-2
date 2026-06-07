const db = require("../config/db");

const listByProperty = async (propertyId) => {
  const [rows] = await db.query(
    `SELECT pa.id, pa.property_id, pa.amenity_id, a.name, a.icon, a.category
     FROM property_amenities pa
     INNER JOIN amenities a ON a.id = pa.amenity_id
     WHERE pa.property_id = ?
     ORDER BY a.category ASC, a.name ASC`,
    [propertyId]
  );

  return rows;
};

const attach = async (propertyId, amenityId) => {
  await db.query(
    "INSERT IGNORE INTO property_amenities (property_id, amenity_id) VALUES (?, ?)",
    [propertyId, amenityId]
  );

  return listByProperty(propertyId);
};

const detach = async (propertyId, amenityId) => {
  const [result] = await db.query(
    "DELETE FROM property_amenities WHERE property_id = ? AND amenity_id = ?",
    [propertyId, amenityId]
  );

  return result.affectedRows;
};

module.exports = {
  listByProperty,
  attach,
  detach,
};


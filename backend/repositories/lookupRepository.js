const db = require("../config/db");

const listPropertyTypes = async () => {
  const [rows] = await db.query(
    `SELECT id, name, slug, icon, created_at, updated_at
     FROM property_types
     ORDER BY name ASC`
  );

  return rows;
};

const listCategories = async () => {
  const [rows] = await db.query(
    `SELECT id, name, slug, created_at, updated_at
     FROM categories
     ORDER BY name ASC`
  );

  return rows;
};

const listCities = async () => {
  const [rows] = await db.query(
    `SELECT id, name, region, country, created_at, updated_at
     FROM cities
     ORDER BY name ASC`
  );

  return rows;
};

const listAmenities = async () => {
  const [rows] = await db.query(
    `SELECT id, name, icon, category, created_at, updated_at
     FROM amenities
     ORDER BY category ASC, name ASC`
  );

  return rows;
};

module.exports = {
  listPropertyTypes,
  listCategories,
  listCities,
  listAmenities,
};

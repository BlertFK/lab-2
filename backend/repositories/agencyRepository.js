const db = require("../config/db");

const create = async (agency) => {
  const [result] = await db.query(
    `INSERT INTO agencies
      (name, email, phone, address, city, state_province, postal_code, country, 
       website, license_number, founded_year, description, logo_url, status, created_by, updated_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      agency.name,
      agency.email,
      agency.phone || null,
      agency.address || null,
      agency.city || null,
      agency.state_province || null,
      agency.postal_code || null,
      agency.country || null,
      agency.website || null,
      agency.license_number,
      agency.founded_year || null,
      agency.description || null,
      agency.logo_url || null,
      agency.status || "active",
      agency.created_by,
      agency.updated_by,
    ]
  );

  return result.insertId;
};

const findById = async (id) => {
  const [rows] = await db.query(
    "SELECT * FROM agencies WHERE id = ?",
    [id]
  );

  return rows[0] || null;
};

const findAll = async (filters = {}) => {
  let query = "SELECT * FROM agencies WHERE 1=1";
  const params = [];

  if (filters.status) {
    query += " AND status = ?";
    params.push(filters.status);
  }

  query += " ORDER BY created_at DESC";

  const [rows] = await db.query(query, params);
  return rows;
};

const findByEmail = async (email) => {
  const [rows] = await db.query(
    "SELECT * FROM agencies WHERE email = ?",
    [email]
  );

  return rows[0] || null;
};

const findByLicenseNumber = async (licenseNumber) => {
  const [rows] = await db.query(
    "SELECT * FROM agencies WHERE license_number = ?",
    [licenseNumber]
  );

  return rows[0] || null;
};

const update = async (id, data) => {
  const [result] = await db.query(
    `UPDATE agencies 
     SET name = COALESCE(?, name),
         email = COALESCE(?, email),
         phone = COALESCE(?, phone),
         address = COALESCE(?, address),
         city = COALESCE(?, city),
         state_province = COALESCE(?, state_province),
         postal_code = COALESCE(?, postal_code),
         country = COALESCE(?, country),
         website = COALESCE(?, website),
         founded_year = COALESCE(?, founded_year),
         description = COALESCE(?, description),
         logo_url = COALESCE(?, logo_url),
         status = COALESCE(?, status),
         updated_by = ?
     WHERE id = ?`,
    [
      data.name || null,
      data.email || null,
      data.phone || null,
      data.address || null,
      data.city || null,
      data.state_province || null,
      data.postal_code || null,
      data.country || null,
      data.website || null,
      data.founded_year || null,
      data.description || null,
      data.logo_url || null,
      data.status || null,
      data.updated_by,
      id,
    ]
  );

  return result.affectedRows;
};

const updateStatus = async (id, status, updatedBy) => {
  const [result] = await db.query(
    "UPDATE agencies SET status = ?, updated_by = ? WHERE id = ?",
    [status, updatedBy, id]
  );

  return result.affectedRows;
};

module.exports = {
  create,
  findById,
  findAll,
  findByEmail,
  findByLicenseNumber,
  update,
  updateStatus,
};

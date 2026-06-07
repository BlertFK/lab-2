const db = require("../config/db");

const create = async (agent) => {
  const [result] = await db.query(
    `INSERT INTO agents
      (user_id, agency_id, license_number, specialization, phone, bio, profile_image_url, 
       commission_rate, verified, status, created_by, updated_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      agent.user_id,
      agent.agency_id || null,
      agent.license_number,
      agent.specialization || null,
      agent.phone || null,
      agent.bio || null,
      agent.profile_image_url || null,
      agent.commission_rate || 5.0,
      agent.verified || false,
      agent.status || "active",
      agent.created_by,
      agent.updated_by,
    ]
  );

  return result.insertId;
};

const findById = async (id) => {
  const [rows] = await db.query(
    `SELECT a.*, u.name, u.email, ag.name AS agency_name
     FROM agents a
     LEFT JOIN users u ON u.id = a.user_id
     LEFT JOIN agencies ag ON ag.id = a.agency_id
     WHERE a.id = ?`,
    [id]
  );

  return rows[0] || null;
};

const findByUserId = async (userId) => {
  const [rows] = await db.query(
    `SELECT a.*, u.name, u.email, ag.name AS agency_name
     FROM agents a
     LEFT JOIN users u ON u.id = a.user_id
     LEFT JOIN agencies ag ON ag.id = a.agency_id
     WHERE a.user_id = ?`,
    [userId]
  );

  return rows[0] || null;
};

const findAll = async (filters = {}) => {
  let query = `
    SELECT a.*, u.name, u.email, ag.name AS agency_name
    FROM agents a
    LEFT JOIN users u ON u.id = a.user_id
    LEFT JOIN agencies ag ON ag.id = a.agency_id
    WHERE 1=1
  `;
  const params = [];

  if (filters.status) {
    query += " AND a.status = ?";
    params.push(filters.status);
  }

  if (filters.agency_id) {
    query += " AND a.agency_id = ?";
    params.push(filters.agency_id);
  }

  if (filters.verified !== undefined) {
    query += " AND a.verified = ?";
    params.push(filters.verified ? 1 : 0);
  }

  query += " ORDER BY a.created_at DESC";

  const [rows] = await db.query(query, params);
  return rows;
};

const findByAgency = async (agencyId, filters = {}) => {
  let query = `
    SELECT a.*, u.name, u.email, ag.name AS agency_name
    FROM agents a
    LEFT JOIN users u ON u.id = a.user_id
    LEFT JOIN agencies ag ON ag.id = a.agency_id
    WHERE a.agency_id = ?
  `;
  const params = [agencyId];

  if (filters.status) {
    query += " AND a.status = ?";
    params.push(filters.status);
  }

  query += " ORDER BY a.created_at DESC";

  const [rows] = await db.query(query, params);
  return rows;
};

const update = async (id, data) => {
  const [result] = await db.query(
    `UPDATE agents 
     SET user_id = COALESCE(?, user_id),
         agency_id = COALESCE(?, agency_id),
         license_number = COALESCE(?, license_number),
         specialization = COALESCE(?, specialization),
         phone = COALESCE(?, phone),
         bio = COALESCE(?, bio),
         profile_image_url = COALESCE(?, profile_image_url),
         commission_rate = COALESCE(?, commission_rate),
         verified = COALESCE(?, verified),
         status = COALESCE(?, status),
         updated_by = ?
     WHERE id = ?`,
    [
      data.user_id || null,
      data.agency_id || null,
      data.license_number || null,
      data.specialization || null,
      data.phone || null,
      data.bio || null,
      data.profile_image_url || null,
      data.commission_rate !== undefined ? data.commission_rate : null,
      data.verified !== undefined ? data.verified : null,
      data.status || null,
      data.updated_by,
      id,
    ]
  );

  return result.affectedRows;
};

const updateStatus = async (id, status, updatedBy) => {
  const [result] = await db.query(
    "UPDATE agents SET status = ?, updated_by = ? WHERE id = ?",
    [status, updatedBy, id]
  );

  return result.affectedRows;
};

module.exports = {
  create,
  findById,
  findByUserId,
  findAll,
  findByAgency,
  update,
  updateStatus,
};

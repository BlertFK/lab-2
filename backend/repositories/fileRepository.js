const db = require("../config/db");

const create = async ({ entity, entityId, filename, originalName, mimeType, filePath, fileSize, width, height, uploadedBy }) => {
  const [result] = await db.query(
    `INSERT INTO files (entity, entity_id, filename, original_name, mime_type, file_path, file_size, width, height, uploaded_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [entity || null, entityId || null, filename, originalName, mimeType, filePath, fileSize, width || null, height || null, uploadedBy]
  );
  return findById(result.insertId);
};

const findById = async (id) => {
  const [rows] = await db.query("SELECT * FROM files WHERE id = ?", [id]);
  return rows[0] || null;
};

const findAll = async ({ entity, page = 1, pageSize = 20 }) => {
  const offset = (page - 1) * pageSize;
  let where = "";
  const params = [];
  if (entity) { where = "WHERE entity = ?"; params.push(entity); }
  const [rows] = await db.query(
    `SELECT * FROM files ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );
  const [[{ total }]] = await db.query(`SELECT COUNT(*) as total FROM files ${where}`, params);
  return { rows, total };
};

const remove = async (id) => {
  await db.query("DELETE FROM files WHERE id = ?", [id]);
};

const updateEntity = async (id, entity, entityId) => {
  await db.query("UPDATE files SET entity = ?, entity_id = ? WHERE id = ?", [entity, entityId, id]);
};

module.exports = { create, findById, findAll, remove, updateEntity };

const db = require("../config/db");

// ──────────────────────────────────────────────
// CMS Pages
// ──────────────────────────────────────────────
const findAllPages = async () => {
  const [rows] = await db.query("SELECT * FROM cms_pages ORDER BY created_at DESC");
  return rows;
};

const findPageById = async (id) => {
  const [rows] = await db.query("SELECT * FROM cms_pages WHERE id = ?", [id]);
  return rows[0] || null;
};

const findPageBySlug = async (slug) => {
  const [rows] = await db.query("SELECT * FROM cms_pages WHERE slug = ?", [slug]);
  return rows[0] || null;
};

const createPage = async ({ slug, title, metaTitle, metaDescription, createdBy }) => {
  const [r] = await db.query(
    "INSERT INTO cms_pages (slug, title, meta_title, meta_description, is_published, created_by, updated_by) VALUES (?,?,?,?,0,?,?)",
    [slug, title, metaTitle || null, metaDescription || null, createdBy, createdBy]
  );
  return findPageById(r.insertId);
};

const updatePage = async (id, { slug, title, metaTitle, metaDescription, updatedBy }) => {
  await db.query(
    "UPDATE cms_pages SET slug=?, title=?, meta_title=?, meta_description=?, updated_by=? WHERE id=?",
    [slug, title, metaTitle || null, metaDescription || null, updatedBy, id]
  );
  return findPageById(id);
};

const deletePage = async (id) => {
  await db.query("DELETE FROM cms_pages WHERE id = ?", [id]);
};

const publishPage = async (id, updatedBy) => {
  await db.query(
    "UPDATE cms_pages SET is_published=1, published_at=NOW(), updated_by=? WHERE id=?",
    [updatedBy, id]
  );
  return findPageById(id);
};

// ──────────────────────────────────────────────
// Sections
// ──────────────────────────────────────────────
const findSectionsByPage = async (pageId) => {
  const [rows] = await db.query(
    "SELECT * FROM cms_sections WHERE page_id=? ORDER BY sort_order ASC",
    [pageId]
  );
  return rows;
};

const findSectionById = async (id) => {
  const [rows] = await db.query("SELECT * FROM cms_sections WHERE id=?", [id]);
  return rows[0] || null;
};

const createSection = async ({ pageId, name, sortOrder, type }) => {
  const [r] = await db.query(
    "INSERT INTO cms_sections (page_id, name, sort_order, type, is_visible) VALUES (?,?,?,?,1)",
    [pageId, name, sortOrder ?? 0, type || "generic"]
  );
  return findSectionById(r.insertId);
};

const updateSection = async (id, { name, sortOrder, type, isVisible }) => {
  await db.query(
    "UPDATE cms_sections SET name=?, sort_order=?, type=?, is_visible=? WHERE id=?",
    [name, sortOrder, type, isVisible ? 1 : 0, id]
  );
  return findSectionById(id);
};

const deleteSection = async (id) => {
  await db.query("DELETE FROM cms_sections WHERE id=?", [id]);
};

// ──────────────────────────────────────────────
// Blocks
// ──────────────────────────────────────────────
const createBlock = async ({ sectionId, keyName, type }) => {
  const empty = type === "link" ? '{"url":"","label":""}' : type === "json" ? '{}' : '{"value":""}';
  const [r] = await db.query(
    "INSERT INTO cms_blocks (section_id, key_name, type, content_json, draft_json) VALUES (?,?,?,?,?)",
    [sectionId, keyName, type, empty, empty]
  );
  return findBlockById(r.insertId);
};

const findBlocksBySection = async (sectionId) => {
  const [rows] = await db.query(
    "SELECT * FROM cms_blocks WHERE section_id=? ORDER BY id ASC",
    [sectionId]
  );
  return rows;
};

const findBlockById = async (id) => {
  const [rows] = await db.query("SELECT * FROM cms_blocks WHERE id=?", [id]);
  return rows[0] || null;
};

const updateBlock = async (id, { contentJson, updatedBy }) => {
  await db.query(
    "UPDATE cms_blocks SET draft_json=?, updated_by=? WHERE id=?",
    [JSON.stringify(contentJson), updatedBy, id]
  );
  return findBlockById(id);
};

const publishBlock = async (id, updatedBy) => {
  // Copy draft to published content_json
  await db.query(
    "UPDATE cms_blocks SET content_json=draft_json, updated_by=? WHERE id=?",
    [updatedBy, id]
  );
  return findBlockById(id);
};

// ──────────────────────────────────────────────
// Versions
// ──────────────────────────────────────────────
const getVersionsByBlock = async (blockId) => {
  const [rows] = await db.query(
    "SELECT * FROM cms_block_versions WHERE block_id=? ORDER BY version_number DESC LIMIT 10",
    [blockId]
  );
  return rows;
};

const createVersion = async ({ blockId, versionNumber, contentJson, createdBy }) => {
  const [r] = await db.query(
    "INSERT INTO cms_block_versions (block_id, version_number, content_json, created_by) VALUES (?,?,?,?)",
    [blockId, versionNumber, JSON.stringify(contentJson), createdBy]
  );
  const [rows] = await db.query("SELECT * FROM cms_block_versions WHERE id=?", [r.insertId]);
  return rows[0];
};

const getLatestVersionNumber = async (blockId) => {
  const [rows] = await db.query(
    "SELECT MAX(version_number) as max_v FROM cms_block_versions WHERE block_id=?",
    [blockId]
  );
  return rows[0]?.max_v || 0;
};

module.exports = {
  findAllPages, findPageById, findPageBySlug, createPage, updatePage, deletePage, publishPage,
  findSectionsByPage, findSectionById, createSection, updateSection, deleteSection,
  findBlocksBySection, findBlockById, createBlock, updateBlock, publishBlock,
  getVersionsByBlock, createVersion, getLatestVersionNumber,
};

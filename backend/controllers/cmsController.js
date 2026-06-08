const cmsService = require("../services/cmsService");

// ── Helpers ──────────────────────────────────────
const safeCall = async (fn, res) => {
  try {
    return await fn();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// ── Pages ──────────────────────────────────────

// GET /api/cms/pages
const listPages = async (_req, res) =>
  safeCall(async () => {
    const pages = await cmsService.getAllPages();
    res.json({ pages });
  }, res);

// GET /api/cms/pages/by-slug/:slug
const getPageBySlug = async (req, res) =>
  safeCall(async () => {
    const preview =
      req.query.preview === "1" && req.user?.role === "admin";

    const page = await cmsService.getPublicPage(req.params.slug, preview);

    if (!page)
      return res.status(404).json({ message: "Page not found." });

    res.json({ page });
  }, res);

// GET /api/cms/pages/:id
const getPage = async (req, res) =>
  safeCall(async () => {
    const page = await cmsService.getPageWithContent(req.params.id);

    if (!page)
      return res.status(404).json({ message: "Page not found." });

    res.json({ page });
  }, res);

// POST /api/cms/pages
const createPage = async (req, res) =>
  safeCall(async () => {
    const { slug, title, meta_title, meta_description } = req.body;

    if (!slug || !title) {
      return res
        .status(400)
        .json({ message: "slug and title are required." });
    }

    if (!cmsService.createPage) {
      return res
        .status(500)
        .json({ message: "cmsService.createPage is missing" });
    }

    const page = await cmsService.createPage({
      slug,
      title,
      metaTitle: meta_title,
      metaDescription: meta_description,
      createdBy: req.user.id,
    });

    res.status(201).json({ page });
  }, res);

// PUT /api/cms/pages/:id
const updatePage = async (req, res) =>
  safeCall(async () => {
    const { slug, title, meta_title, meta_description } = req.body;

    const page = await cmsService.updatePage(req.params.id, {
      slug,
      title,
      metaTitle: meta_title,
      metaDescription: meta_description,
      updatedBy: req.user.id,
    });

    if (!page)
      return res.status(404).json({ message: "Page not found." });

    res.json({ page });
  }, res);

// DELETE /api/cms/pages/:id
const deletePage = async (req, res) =>
  safeCall(async () => {
    await cmsService.deletePage(req.params.id);
    res.json({ message: "Page deleted." });
  }, res);

// POST /api/cms/pages/:id/publish
const publishPage = async (req, res) =>
  safeCall(async () => {
    const page = await cmsService.publishPage(
      req.params.id,
      req.user.id
    );

    res.json({ page, message: "Page published." });
  }, res);

// ── Sections ──────────────────────────────────

const createSection = async (req, res) =>
  safeCall(async () => {
    const { name, sort_order, type } = req.body;

    if (!name)
      return res.status(400).json({ message: "name is required." });

    const section = await cmsService.createSection({
      pageId: req.params.id,
      name,
      sortOrder: sort_order,
      type,
    });

    res.status(201).json({ section });
  }, res);

const updateSection = async (req, res) =>
  safeCall(async () => {
    const { name, sort_order, type, is_visible } = req.body;

    const section = await cmsService.updateSection(req.params.id, {
      name,
      sortOrder: sort_order,
      type,
      isVisible: is_visible,
    });

    res.json({ section });
  }, res);

const deleteSection = async (req, res) =>
  safeCall(async () => {
    await cmsService.deleteSection(req.params.id);
    res.json({ message: "Section deleted." });
  }, res);

// ── Blocks ────────────────────────────────────

const createBlock = async (req, res) =>
  safeCall(async () => {
    const { key_name, type } = req.body;
    if (!key_name || !type)
      return res.status(400).json({ message: "key_name and type are required." });

    const VALID_TYPES = ["text", "image", "link", "json"];
    if (!VALID_TYPES.includes(type))
      return res.status(400).json({ message: `type must be one of: ${VALID_TYPES.join(", ")}` });

    const block = await cmsService.createBlock({
      sectionId: req.params.id,
      keyName: key_name,
      type,
    });

    res.status(201).json({ block });
  }, res);

const updateBlock = async (req, res) =>
  safeCall(async () => {
    const { content_json } = req.body;

    if (!content_json)
      return res
        .status(400)
        .json({ message: "content_json is required." });

    const block = await cmsService.updateBlock(req.params.id, {
      contentJson: content_json,
      updatedBy: req.user.id,
    });

    res.json({ block, message: "Block saved as draft." });
  }, res);

const publishBlock = async (req, res) =>
  safeCall(async () => {
    const block = await cmsService.publishBlock(
      req.params.id,
      req.user.id
    );

    res.json({ block, message: "Block published." });
  }, res);

const getBlockVersions = async (req, res) =>
  safeCall(async () => {
    const versions = await cmsService.getBlockVersions(
      req.params.id
    );

    res.json({ versions });
  }, res);

const restoreVersion = async (req, res) =>
  safeCall(async () => {
    const block = await cmsService.restoreVersion(
      req.params.id,
      req.params.version,
      req.user.id
    );

    if (!block)
      return res.status(404).json({ message: "Version not found." });

    res.json({ block, message: "Version restored as draft." });
  }, res);

// ── EXPORTS ──────────────────────────────────────
module.exports = {
  listPages,
  getPageBySlug,
  getPage,
  createPage,
  updatePage,
  deletePage,
  publishPage,

  createSection,
  updateSection,
  deleteSection,

  createBlock,
  updateBlock,
  publishBlock,
  getBlockVersions,
  restoreVersion,
};
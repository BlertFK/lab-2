const repo = require("../repositories/cmsRepository");

// ── Pages ──────────────────────────────────────
const getAllPages = () => repo.findAllPages();

const getPageWithContent = async (id) => {
  const page = await repo.findPageById(id);
  if (!page) return null;
  const sections = await repo.findSectionsByPage(id);
  for (const section of sections) {
    section.blocks = await repo.findBlocksBySection(section.id);
  }
  page.sections = sections;
  return page;
};

const getPublicPage = async (slug, preview = false) => {
  const page = await repo.findPageBySlug(slug);
  if (!page) return null;
  if (!page.is_published && !preview) return null;
  const sections = await repo.findSectionsByPage(page.id);
  for (const section of sections) {
    const blocks = await repo.findBlocksBySection(section.id);
    // In preview mode return draft_json, in published mode return content_json
    section.blocks = blocks.map((b) => ({
      ...b,
      rendered_json: preview
        ? (b.draft_json ? JSON.parse(b.draft_json) : JSON.parse(b.content_json || "{}"))
        : JSON.parse(b.content_json || "{}"),
    }));
  }
  page.sections = sections;
  return page;
};

const createPage = (data) => repo.createPage(data);

const updatePage = (id, data) => repo.updatePage(id, data);

const deletePage = (id) => repo.deletePage(id);

const publishPage = async (id, updatedBy) => {
  // Publish all blocks in this page
  const sections = await repo.findSectionsByPage(id);
  for (const section of sections) {
    const blocks = await repo.findBlocksBySection(section.id);
    for (const block of blocks) {
      await repo.publishBlock(block.id, updatedBy);
    }
  }
  return repo.publishPage(id, updatedBy);
};

// ── Sections ──────────────────────────────────
const createSection = async ({ pageId, name, sortOrder, type }) => {
  return repo.createSection({ pageId, name, sortOrder, type });
};

const updateSection = (id, data) => repo.updateSection(id, data);
const deleteSection = (id) => repo.deleteSection(id);

// ── Blocks ────────────────────────────────────
const createBlock = ({ sectionId, keyName, type }) =>
  repo.createBlock({ sectionId, keyName, type });

const updateBlock = async (id, { contentJson, updatedBy }) => {
  // Save a version snapshot first
  const block = await repo.findBlockById(id);
  if (block) {
    const nextVersion = (await repo.getLatestVersionNumber(id)) + 1;
    await repo.createVersion({
      blockId: id,
      versionNumber: nextVersion,
      contentJson,
      createdBy: updatedBy,
    });
  }
  return repo.updateBlock(id, { contentJson, updatedBy });
};

const publishBlock = (id, updatedBy) => repo.publishBlock(id, updatedBy);

const getBlockVersions = (blockId) => repo.getVersionsByBlock(blockId);

const restoreVersion = async (blockId, versionNumber, updatedBy) => {
  const versions = await repo.getVersionsByBlock(blockId);
  const target = versions.find((v) => v.version_number === parseInt(versionNumber));
  if (!target) return null;
  const contentJson = JSON.parse(target.content_json);
  return updateBlock(blockId, { contentJson, updatedBy });
};

module.exports = {
  getAllPages, getPageWithContent, getPublicPage, createPage, updatePage, deletePage, publishPage,
  createSection, updateSection, deleteSection,
  createBlock, updateBlock, publishBlock, getBlockVersions, restoreVersion,
};

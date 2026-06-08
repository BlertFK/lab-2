const sharp = require("sharp");
const fs = require("fs");
const path = require("path");
const fileRepo = require("../repositories/fileRepository");

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";

/**
 * Process an uploaded file: extract dimensions for images, then persist to DB.
 */
const processAndSave = async ({ file, entity, entityId, uploadedBy }) => {
  let width = null;
  let height = null;
  const filePath = path.relative(process.cwd(), file.path);

  // For images, extract dimensions via sharp
  if (file.mimetype.startsWith("image/")) {
    try {
      const meta = await sharp(file.path).metadata();
      width = meta.width || null;
      height = meta.height || null;
    } catch (_) {
      // Non-fatal: dimensions stay null
    }
  }

  return fileRepo.create({
    entity: entity || null,
    entityId: entityId || null,
    filename: file.filename,
    originalName: file.originalname,
    mimeType: file.mimetype,
    filePath,
    fileSize: file.size,
    width,
    height,
    uploadedBy,
  });
};

const getById = async (id) => fileRepo.findById(id);

const getAll = async (filters) => fileRepo.findAll(filters);

const deleteFile = async (id) => {
  const file = await fileRepo.findById(id);
  if (!file) return null;
  // Remove from disk
  const fullPath = path.join(process.cwd(), file.file_path);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
  await fileRepo.remove(id);
  return file;
};

module.exports = { processAndSave, getById, getAll, deleteFile };

const path = require("path");
const fileService = require("../services/fileService");

const safeCall = async (fn, res) => {
  try {
    return await fn();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

const uploadFile = async (req, res) =>
  safeCall(async () => {
    if (!req.file)
      return res.status(400).json({ message: "No file provided." });

    const { entity, entityId } = req.body;
    const file = await fileService.processAndSave({
      file: req.file,
      entity: entity || null,
      entityId: entityId || null,
      uploadedBy: req.user.id,
    });

    res.status(201).json({ file });
  }, res);

const listFiles = async (req, res) =>
  safeCall(async () => {
    const files = await fileService.getAll(req.query);
    res.json({ files });
  }, res);

const getFile = async (req, res) =>
  safeCall(async () => {
    const file = await fileService.getById(req.params.id);
    if (!file) return res.status(404).json({ message: "File not found." });
    res.json({ file });
  }, res);

const downloadFile = async (req, res) =>
  safeCall(async () => {
    const file = await fileService.getById(req.params.id);
    if (!file) return res.status(404).json({ message: "File not found." });
    const fullPath = path.join(process.cwd(), file.file_path);
    res.download(fullPath, file.original_name);
  }, res);

const deleteFile = async (req, res) =>
  safeCall(async () => {
    const file = await fileService.deleteFile(req.params.id);
    if (!file) return res.status(404).json({ message: "File not found." });
    res.json({ message: "File deleted." });
  }, res);

module.exports = { uploadFile, listFiles, getFile, downloadFile, deleteFile };

const propertyImageRepository = require("../repositories/propertyImageRepository");

const isPositiveId = (value) => Number.isInteger(Number(value)) && Number(value) > 0;

const handleError = (res, error) => {
  console.error("Property image error:", error.message);
  res.status(500).json({ message: "Server error. Please try again." });
};

const getPropertyImages = async (req, res) => {
  try {
    const images = await propertyImageRepository.listByProperty(req.params.propertyId);
    res.status(200).json({ images });
  } catch (error) {
    handleError(res, error);
  }
};

const attachImage = async (req, res) => {
  const propertyId = Number(req.params.propertyId);
  const hasFileId = isPositiveId(req.body.file_id);
  const hasImageUrl = typeof req.body.image_url === "string" && req.body.image_url.trim() !== "";

  if (!isPositiveId(propertyId) || (!hasFileId && !hasImageUrl)) {
    return res.status(400).json({ message: "Valid property_id and either file_id or image_url are required." });
  }

  try {
    const imageId = await propertyImageRepository.create(propertyId, {
      file_id: hasFileId ? Number(req.body.file_id) : null,
      image_url: hasImageUrl ? req.body.image_url.trim() : null,
      sort_order: Number(req.body.sort_order || 0),
      is_primary: Boolean(req.body.is_primary),
      caption: req.body.caption,
    });
    const images = await propertyImageRepository.listByProperty(propertyId);
    res.status(201).json({ message: "Image attached to property.", imageId, images });
  } catch (error) {
    handleError(res, error);
  }
};

const detachImage = async (req, res) => {
  const propertyId = Number(req.params.propertyId);
  const imageId = Number(req.params.imageId);

  if (!isPositiveId(propertyId) || !isPositiveId(imageId)) {
    return res.status(400).json({ message: "Valid property_id and image_id are required." });
  }

  try {
    const affectedRows = await propertyImageRepository.remove(propertyId, imageId);
    if (!affectedRows) return res.status(404).json({ message: "Image not found." });
    res.status(200).json({ message: "Image detached from property." });
  } catch (error) {
    handleError(res, error);
  }
};

const setPrimaryImage = async (req, res) => {
  const propertyId = Number(req.params.propertyId);
  const imageId = Number(req.params.imageId);

  if (!isPositiveId(propertyId) || !isPositiveId(imageId)) {
    return res.status(400).json({ message: "Valid property_id and image_id are required." });
  }

  try {
    const affectedRows = await propertyImageRepository.setPrimary(propertyId, imageId);
    if (!affectedRows) return res.status(404).json({ message: "Image not found." });
    const images = await propertyImageRepository.listByProperty(propertyId);
    res.status(200).json({ message: "Primary image updated.", images });
  } catch (error) {
    handleError(res, error);
  }
};

module.exports = {
  getPropertyImages,
  attachImage,
  detachImage,
  setPrimaryImage,
};


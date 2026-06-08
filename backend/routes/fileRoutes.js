const express = require("express");
const router = express.Router();
const { verifyToken, requireRole } = require("../middleware/authMiddleware");
const { upload } = require("../middleware/uploadMiddleware");
const fc = require("../controllers/fileController");

router.post("/upload", verifyToken, upload.single("file"), fc.uploadFile);
router.get("/", verifyToken, requireRole("admin"), fc.listFiles);
router.get("/:id", verifyToken, fc.getFile);
router.get("/:id/download", verifyToken, fc.downloadFile);
router.delete("/:id", verifyToken, fc.deleteFile);

module.exports = router;

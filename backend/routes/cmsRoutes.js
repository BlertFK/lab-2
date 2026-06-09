const express = require("express");
const router = express.Router();
const { verifyToken, optionalVerifyToken, requireRole } = require("../middleware/authMiddleware");
const cc = require("../controllers/cmsController");

const admin = [verifyToken, requireRole("admin")];

// Pages
router.get("/pages", ...admin, cc.listPages);
router.get("/pages/by-slug/:slug", optionalVerifyToken, cc.getPageBySlug); // public, admin draft preview when authenticated
router.get("/pages/:id", ...admin, cc.getPage);
router.post("/pages", ...admin, cc.createPage);
router.put("/pages/:id", ...admin, cc.updatePage);
router.delete("/pages/:id", ...admin, cc.deletePage);
router.post("/pages/:id/publish", ...admin, cc.publishPage);

// Sections
router.post("/pages/:id/sections", ...admin, cc.createSection);
router.put("/sections/:id", ...admin, cc.updateSection);
router.delete("/sections/:id", ...admin, cc.deleteSection);

// Blocks
router.post("/sections/:id/blocks", ...admin, cc.createBlock);
router.put("/blocks/:id", ...admin, cc.updateBlock);
router.post("/blocks/:id/publish", ...admin, cc.publishBlock);
router.get("/blocks/:id/versions", ...admin, cc.getBlockVersions);
router.post("/blocks/:id/restore/:version", ...admin, cc.restoreVersion);

module.exports = router;

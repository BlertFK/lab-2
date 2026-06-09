const express = require("express");
const router = express.Router();

const { authenticate } = require("../middleware/auth.middleware");
const { requirePermission } = require("../middleware/permission.middleware");
const auditCtrl = require("../controllers/audit.controller");

router.use(authenticate);
router.get("/",    requirePermission("audit.view"), auditCtrl.list);
router.get("/:id", requirePermission("audit.view"), auditCtrl.getById);

module.exports = router;

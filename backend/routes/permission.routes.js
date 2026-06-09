const express = require("express");
const router = express.Router();

const { authenticate } = require("../middleware/auth.middleware");
const { requirePermission } = require("../middleware/permission.middleware");
const permissionCtrl = require("../controllers/permission.controller");

router.use(authenticate);
router.get("/", requirePermission("permissions.view"), permissionCtrl.list);

module.exports = router;

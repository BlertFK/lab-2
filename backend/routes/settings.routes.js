const express = require("express");
const router = express.Router();

const { authenticate } = require("../middleware/auth.middleware");
const { requirePermission } = require("../middleware/permission.middleware");
const validate = require("../middleware/validate.middleware");
const settingsCtrl = require("../controllers/settings.controller");
const settingsSchemas = require("../validators/settings.validator");

router.use(authenticate);
router.get("/",        settingsCtrl.list);
router.put("/:key",    requirePermission("settings.manage"), validate(settingsSchemas.upsert), settingsCtrl.updateByKey);

module.exports = router;

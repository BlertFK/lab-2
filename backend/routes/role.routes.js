const express = require("express");
const router = express.Router();

const { authenticate } = require("../middleware/auth.middleware");
const { requirePermission } = require("../middleware/permission.middleware");
const validate = require("../middleware/validate.middleware");
const roleCtrl = require("../controllers/role.controller");
const roleSchemas = require("../validators/role.validator");

router.use(authenticate);

router.get("/",        requirePermission("roles.view"),   roleCtrl.list);
router.post("/",       requirePermission("roles.manage"), validate(roleSchemas.create), roleCtrl.create);
router.put("/:id",     requirePermission("roles.manage"), validate(roleSchemas.update), roleCtrl.update);
router.delete("/:id",  requirePermission("roles.manage"), roleCtrl.remove);

router.get("/:id/permissions",                requirePermission("roles.view"),   roleCtrl.listPermissions);
router.post("/:id/permissions",               requirePermission("roles.manage"), validate(roleSchemas.assignPermission), roleCtrl.assignPermission);
router.delete("/:id/permissions/:permId",     requirePermission("roles.manage"), roleCtrl.revokePermission);

module.exports = router;

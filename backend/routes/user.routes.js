const express = require("express");
const router = express.Router();

const { authenticate } = require("../middleware/auth.middleware");
const { requirePermission } = require("../middleware/permission.middleware");
const validate = require("../middleware/validate.middleware");
const userCtrl = require("../controllers/user.controller");
const roleCtrl = require("../controllers/role.controller");
const userSchemas = require("../validators/user.validator");

router.use(authenticate);

router.get("/",        requirePermission("users.view"), userCtrl.list);
router.get("/:id",     userCtrl.getById); // self-check inside
router.put("/:id",     validate(userSchemas.update), userCtrl.update); // self or perm inside
router.patch("/:id/status", requirePermission("users.update"), validate(userSchemas.status), userCtrl.setStatus);
router.delete("/:id",  requirePermission("users.delete"), userCtrl.softDelete);

// Role assignments on a user (B21 mounts under /api/users/:id/roles)
router.post("/:id/roles",            requirePermission("roles.manage"), validate(userSchemas.assignRole), roleCtrl.assignRoleToUser);
router.delete("/:id/roles/:roleId",  requirePermission("roles.manage"), roleCtrl.revokeRoleFromUser);

module.exports = router;

/**
 * @openapi
 * tags:
 *   - name: Roles
 *     description: Roles + role-permission management (admin)
 */

const roleService = require("../services/role.service");

/**
 * @openapi
 * /api/roles:
 *   get:
 *     tags: [Roles]
 *     summary: List roles with user + permission counts. Requires roles.view.
 *     responses: { 200: { description: Roles list } }
 *   post:
 *     tags: [Roles]
 *     summary: Create a new (non-system) role. Requires roles.manage.
 *
 * /api/roles/{id}/permissions:
 *   get:
 *     tags: [Roles]
 *     summary: Permissions assigned to a role.
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer } }]
 *   post:
 *     tags: [Roles]
 *     summary: Assign a permission to a role. body { permission_id }.
 *
 * /api/users/{id}/roles:
 *   post:
 *     tags: [Roles]
 *     summary: Assign a role to a user. body { role_id }. Requires roles.manage.
 */
async function list(_req, res, next) {
  try { res.json(await roleService.listRoles()); } catch (err) { next(err); }
}

async function create(req, res, next) {
  try { res.status(201).json(await roleService.createRole(req.body)); } catch (err) { next(err); }
}

async function update(req, res, next) {
  try { res.json(await roleService.updateRole(Number(req.params.id), req.body)); } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try { res.json(await roleService.deleteRole(Number(req.params.id))); } catch (err) { next(err); }
}

async function listPermissions(req, res, next) {
  try { res.json(await roleService.listRolePermissions(Number(req.params.id))); } catch (err) { next(err); }
}

async function assignPermission(req, res, next) {
  try {
    res.status(201).json(await roleService.assignPermission(
      Number(req.params.id),
      Number(req.body.permission_id)
    ));
  } catch (err) { next(err); }
}

async function revokePermission(req, res, next) {
  try {
    res.json(await roleService.revokePermission(
      Number(req.params.id),
      Number(req.params.permId)
    ));
  } catch (err) { next(err); }
}

async function assignRoleToUser(req, res, next) {
  try {
    res.status(201).json(await roleService.assignRoleToUser(
      Number(req.params.id),
      Number(req.body.role_id),
      req.user.id
    ));
  } catch (err) { next(err); }
}

async function revokeRoleFromUser(req, res, next) {
  try {
    res.json(await roleService.revokeRoleFromUser(
      Number(req.params.id),
      Number(req.params.roleId)
    ));
  } catch (err) { next(err); }
}

module.exports = {
  list, create, update, remove,
  listPermissions, assignPermission, revokePermission,
  assignRoleToUser, revokeRoleFromUser,
};

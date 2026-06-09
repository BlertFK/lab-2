/**
 * @openapi
 * tags:
 *   - name: Users
 *     description: User management (admin)
 */

const userService = require("../services/user.service");
const { ForbiddenError } = require("../utils/errors.util");

/**
 * @openapi
 * /api/users:
 *   get:
 *     tags: [Users]
 *     summary: List users (paginated). Requires users.view.
 *     parameters:
 *       - { in: query, name: page, schema: { type: integer, default: 1 } }
 *       - { in: query, name: pageSize, schema: { type: integer, default: 20 } }
 *       - { in: query, name: search, schema: { type: string } }
 *       - { in: query, name: role, schema: { type: string } }
 *       - { in: query, name: is_active, schema: { type: boolean } }
 *     responses:
 *       200: { description: Paged user list }
 */
async function list(req, res, next) {
  try {
    const result = await userService.list(req);
    res.json(result);
  } catch (err) { next(err); }
}

/**
 * @openapi
 * /api/users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get one user with roles + permissions. Self or users.view.
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer } }]
 *     responses: { 200: { description: User detail }, 403: { description: Forbidden } }
 *   put:
 *     tags: [Users]
 *     summary: Update a user. Self can edit own profile; admin can edit any.
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer } }]
 *   delete:
 *     tags: [Users]
 *     summary: Soft-delete (deactivate) a user. Requires users.delete.
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer } }]
 */
async function getById(req, res, next) {
  try {
    const id = Number(req.params.id);
    // self can always read self
    const isSelf = req.user && Number(req.user.id) === id;
    if (!isSelf && !req.user.permissions.includes("users.view")
        && !(req.user.roles || []).some((r) => String(r).toLowerCase() === "admin")) {
      throw new ForbiddenError("Missing permission: users.view");
    }
    const result = await userService.getById(id);
    res.json(result);
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const id = Number(req.params.id);
    const isSelf = req.user && Number(req.user.id) === id;
    const hasPerm = req.user.permissions.includes("users.update")
      || (req.user.roles || []).some((r) => String(r).toLowerCase() === "admin");
    if (!isSelf && !hasPerm) {
      throw new ForbiddenError("Cannot update another user");
    }
    const result = await userService.update(id, req.body);
    res.json(result);
  } catch (err) { next(err); }
}

async function setStatus(req, res, next) {
  try {
    const id = Number(req.params.id);
    const result = await userService.setActive(id, req.body.is_active);
    res.json(result);
  } catch (err) { next(err); }
}

async function softDelete(req, res, next) {
  try {
    const id = Number(req.params.id);
    const result = await userService.softDelete(id);
    res.json(result);
  } catch (err) { next(err); }
}

module.exports = { list, getById, update, setStatus, softDelete };

/**
 * @openapi
 * tags:
 *   - name: Permissions
 */
const permissionService = require("../services/permission.service");

async function list(req, res, next) {
  try {
    if (req.query.grouped === "true") {
      return res.json(await permissionService.grouped());
    }
    res.json(await permissionService.listAll());
  } catch (err) { next(err); }
}

module.exports = { list };

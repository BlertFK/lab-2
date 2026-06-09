/**
 * @openapi
 * tags:
 *   - name: Settings
 */
const settingsService = require("../services/settings.service");

/**
 * @openapi
 * /api/settings:
 *   get:
 *     tags: [Settings]
 *     summary: List settings. Non-admins see only is_public=true entries.
 *     responses: { 200: { description: Settings list } }
 *
 * /api/settings/{key}:
 *   put:
 *     tags: [Settings]
 *     summary: Upsert a setting value. Requires settings.manage.
 *     parameters: [{ in: path, name: key, required: true, schema: { type: string } }]
 */
async function list(req, res, next) {
  try {
    // Non-admin / non-settings.view callers get public settings only
    const isAdmin = (req.user?.roles || []).some((r) => String(r).toLowerCase() === "admin");
    const canViewAll = isAdmin || (req.user?.permissions || []).includes("settings.view");
    const data = await settingsService.listAll({ publicOnly: !canViewAll });
    res.json(data);
  } catch (err) { next(err); }
}

async function updateByKey(req, res, next) {
  try {
    const result = await settingsService.updateByKey(req.params.key, {
      ...req.body,
      updatedBy: req.user.id,
    });
    res.json(result);
  } catch (err) { next(err); }
}

module.exports = { list, updateByKey };

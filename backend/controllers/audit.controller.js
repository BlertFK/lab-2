/**
 * @openapi
 * tags:
 *   - name: Audit
 */
const auditService = require("../services/audit.service");

/**
 * @openapi
 * /api/audit-logs:
 *   get:
 *     tags: [Audit]
 *     summary: Paginated audit log. Requires audit.view.
 *     parameters:
 *       - { in: query, name: user_id, schema: { type: integer } }
 *       - { in: query, name: entity, schema: { type: string } }
 *       - { in: query, name: action, schema: { type: string } }
 *       - { in: query, name: date_from, schema: { type: string, format: date } }
 *       - { in: query, name: date_to, schema: { type: string, format: date } }
 *     responses: { 200: { description: Paged audit entries } }
 */
async function list(req, res, next) {
  try { res.json(await auditService.list(req)); } catch (err) { next(err); }
}

async function getById(req, res, next) {
  try { res.json(await auditService.getById(Number(req.params.id))); } catch (err) { next(err); }
}

module.exports = { list, getById };

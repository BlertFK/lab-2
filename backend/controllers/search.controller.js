/**
 * @openapi
 * tags: [{ name: Search }]
 */
const searchService = require("../services/search.service");

/**
 * @openapi
 * /api/search:
 *   get:
 *     tags: [Search]
 *     summary: Universal search across properties, users, viewings, offers, messages
 *     parameters:
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *         required: true
 *       - in: query
 *         name: entities
 *         schema: { type: string, example: "properties,users" }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200: { description: Grouped results per entity }
 */
async function search(req, res, next) {
  try {
    const q = (req.query.q || "").toString();
    const entities = (req.query.entities || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
    const data = await searchService.search({ q, entities, limit }, req.user);
    res.json(data);
  } catch (err) { next(err); }
}

module.exports = { search };

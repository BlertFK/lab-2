/**
 * @openapi
 * tags:
 *   - name: Notifications
 */
const notificationService = require("../services/notification.service");

/**
 * @openapi
 * /api/notifications:
 *   get:
 *     tags: [Notifications]
 *     summary: List current user's notifications. ?unreadOnly=true to filter.
 *     responses: { 200: { description: Paged notifications with unread count } }
 *
 * /api/notifications/{id}/read:
 *   patch:
 *     tags: [Notifications]
 *     summary: Mark a single notification read.
 *
 * /api/notifications/read-all:
 *   patch:
 *     tags: [Notifications]
 *     summary: Mark every notification read.
 */
async function list(req, res, next) {
  try { res.json(await notificationService.listForUser(req)); } catch (err) { next(err); }
}

async function markRead(req, res, next) {
  try { res.json(await notificationService.markRead(req)); } catch (err) { next(err); }
}

async function markAllRead(req, res, next) {
  try { res.json(await notificationService.markAllRead(req)); } catch (err) { next(err); }
}

module.exports = { list, markRead, markAllRead };

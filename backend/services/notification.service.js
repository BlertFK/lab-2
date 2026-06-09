// Blert: notification list / mark-read API surface.
// Notification creation + socket emission still flows through services/notificationService.js
// (Fadil's existing helper) so existing callers don't need to change.

const notificationRepo = require("../repositories/notification.repository");
const { NotFoundError } = require("../utils/errors.util");
const { parsePagination, buildPagedResponse } = require("../utils/pagination.util");

async function listForUser(req) {
  const { page, pageSize, limit, offset } = parsePagination(req);
  const unreadOnly = req.query.unreadOnly === "true" || req.query.unreadOnly === "1";

  const { data, total, unread } = await notificationRepo.listForUser({
    userId: req.user.id,
    unreadOnly,
    limit,
    offset,
  });
  const response = buildPagedResponse(data, total, { page, pageSize });
  response.unread = unread;
  return response;
}

async function markRead(req) {
  const id = Number(req.params.id);
  const ok = await notificationRepo.markRead(id, req.user.id);
  if (!ok) throw new NotFoundError("Notification not found");
  return { id, is_read: true };
}

async function markAllRead(req) {
  const updated = await notificationRepo.markAllRead(req.user.id);
  return { updated };
}

module.exports = { listForUser, markRead, markAllRead };

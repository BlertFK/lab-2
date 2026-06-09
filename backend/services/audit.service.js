const auditRepo = require("../repositories/auditLog.repository");
const { NotFoundError } = require("../utils/errors.util");
const { parsePagination, buildPagedResponse } = require("../utils/pagination.util");

async function log(entry) {
  return auditRepo.log(entry);
}

async function list(req) {
  const { page, pageSize, limit, offset } = parsePagination(req);
  const { user_id, entity, action, date_from, date_to } = req.query;
  const { data, total } = await auditRepo.listPaginated({
    userId: user_id ? Number(user_id) : undefined,
    entity,
    action,
    dateFrom: date_from,
    dateTo: date_to,
    limit,
    offset,
  });
  return buildPagedResponse(data, total, { page, pageSize });
}

async function getById(id) {
  const row = await auditRepo.findByIdJoined(id);
  if (!row) throw new NotFoundError("Audit entry not found");
  return row;
}

module.exports = { log, list, getById };

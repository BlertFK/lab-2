const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

function parsePagination(req) {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const requested = parseInt(req.query.pageSize, 10) || DEFAULT_PAGE_SIZE;
  const pageSize = Math.min(Math.max(requested, 1), MAX_PAGE_SIZE);
  const offset = (page - 1) * pageSize;
  return { page, pageSize, offset, limit: pageSize };
}

function parseSort(req, allowedFields = [], defaultSort = null) {
  const raw = req.query.sort;
  if (!raw) return defaultSort;
  const [field, dirRaw] = String(raw).split(":");
  const dir = (dirRaw || "asc").toLowerCase() === "desc" ? "DESC" : "ASC";
  if (allowedFields.length && !allowedFields.includes(field)) return defaultSort;
  return { field, dir };
}

function buildPagedResponse(data, total, { page, pageSize }) {
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);
  return {
    data,
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

module.exports = {
  parsePagination,
  parseSort,
  buildPagedResponse,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
};

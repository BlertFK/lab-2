const userRepo = require("../repositories/user.repository");
const { NotFoundError } = require("../utils/errors.util");
const { parsePagination, buildPagedResponse } = require("../utils/pagination.util");

async function list(req) {
  const { page, pageSize, limit, offset } = parsePagination(req);
  const { search, role } = req.query;
  const isActive = req.query.is_active === undefined
    ? undefined
    : req.query.is_active === "true" || req.query.is_active === "1";

  const { data, total } = await userRepo.listPaginated({
    search,
    role,
    isActive,
    limit,
    offset,
  });
  return buildPagedResponse(data, total, { page, pageSize });
}

async function getById(id) {
  const user = await userRepo.findUserWithRolesAndPermissions(id);
  if (!user) throw new NotFoundError("User not found");
  return {
    id: user.id,
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    phone: user.phone,
    avatar_file_id: user.avatar_file_id,
    is_active: !!user.is_active,
    email_verified_at: user.email_verified_at,
    last_login_at: user.last_login_at,
    created_at: user.created_at,
    roles: user.roles,
    permissions: user.permissions,
  };
}

async function update(id, body) {
  const existing = await userRepo.findById(id);
  if (!existing) throw new NotFoundError("User not found");

  const allowed = ["first_name", "last_name", "phone", "avatar_file_id"];
  const patch = {};
  for (const k of allowed) {
    if (body[k] !== undefined) patch[k] = body[k];
  }
  if (!Object.keys(patch).length) return getById(id);
  await userRepo.update(id, patch);
  return getById(id);
}

async function setActive(id, isActive) {
  const existing = await userRepo.findById(id);
  if (!existing) throw new NotFoundError("User not found");
  await userRepo.setActive(id, isActive);
  return getById(id);
}

async function softDelete(id) {
  const existing = await userRepo.findById(id);
  if (!existing) throw new NotFoundError("User not found");
  await userRepo.setActive(id, false);
  return { id, is_active: false };
}

module.exports = { list, getById, update, setActive, softDelete };

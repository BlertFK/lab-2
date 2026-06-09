const roleRepo = require("../repositories/role.repository");
const permissionRepo = require("../repositories/permission.repository");
const userRepo = require("../repositories/user.repository");
const { NotFoundError, ConflictError, ForbiddenError } = require("../utils/errors.util");

async function listRoles() {
  return roleRepo.listAllWithCounts();
}

async function createRole({ name, description }) {
  const existing = await roleRepo.findByName(name);
  if (existing) throw new ConflictError(`Role '${name}' already exists`);
  const role = await roleRepo.create({ name, description: description || null, is_system: 0 });
  return role;
}

async function updateRole(id, { name, description }) {
  const role = await roleRepo.findById(id);
  if (!role) throw new NotFoundError("Role not found");
  if (role.is_system && name && name !== role.name) {
    throw new ForbiddenError("System roles cannot be renamed");
  }
  const patch = {};
  if (name !== undefined) patch.name = name;
  if (description !== undefined) patch.description = description;
  if (Object.keys(patch).length) await roleRepo.update(id, patch);
  return roleRepo.findById(id);
}

async function deleteRole(id) {
  const role = await roleRepo.findById(id);
  if (!role) throw new NotFoundError("Role not found");
  if (role.is_system) throw new ForbiddenError("System roles cannot be deleted");
  await roleRepo.delete(id);
  return { ok: true };
}

async function listRolePermissions(roleId) {
  const role = await roleRepo.findById(roleId);
  if (!role) throw new NotFoundError("Role not found");
  return roleRepo.findPermissionsForRole(roleId);
}

async function assignPermission(roleId, permissionId) {
  const role = await roleRepo.findById(roleId);
  if (!role) throw new NotFoundError("Role not found");
  const perm = await permissionRepo.findById(permissionId);
  if (!perm) throw new NotFoundError("Permission not found");
  await roleRepo.assignPermission(roleId, permissionId);
  return { ok: true };
}

async function revokePermission(roleId, permissionId) {
  await roleRepo.revokePermission(roleId, permissionId);
  return { ok: true };
}

async function assignRoleToUser(userId, roleId, assignedBy) {
  const user = await userRepo.findById(userId);
  if (!user) throw new NotFoundError("User not found");
  const role = await roleRepo.findById(roleId);
  if (!role) throw new NotFoundError("Role not found");
  await roleRepo.assignToUser(userId, roleId, assignedBy);
  return { ok: true };
}

async function revokeRoleFromUser(userId, roleId) {
  await roleRepo.revokeFromUser(userId, roleId);
  return { ok: true };
}

module.exports = {
  listRoles,
  createRole,
  updateRole,
  deleteRole,
  listRolePermissions,
  assignPermission,
  revokePermission,
  assignRoleToUser,
  revokeRoleFromUser,
};

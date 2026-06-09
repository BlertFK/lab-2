const permissionRepo = require("../repositories/permission.repository");

async function listAll() {
  return permissionRepo.listAll();
}

async function grouped() {
  return permissionRepo.groupedByResource();
}

module.exports = { listAll, grouped };

const settingsRepo = require("../repositories/settings.repository");
const { NotFoundError } = require("../utils/errors.util");

function parseValue(setting) {
  if (setting.value === null || setting.value === undefined) return null;
  switch (setting.type) {
    case "number":
      return Number(setting.value);
    case "boolean":
      return setting.value === "true" || setting.value === "1";
    case "json":
      try { return JSON.parse(setting.value); } catch (_) { return null; }
    case "string":
    default:
      return setting.value;
  }
}

function toDto(setting) {
  return {
    key: setting.key,
    value: parseValue(setting),
    raw: setting.value,
    type: setting.type,
    description: setting.description,
    is_public: !!setting.is_public,
    updated_at: setting.updated_at,
  };
}

async function listAll({ publicOnly = false } = {}) {
  const rows = await settingsRepo.listAll({ publicOnly });
  return rows.map(toDto);
}

async function updateByKey(key, { value, type, description, is_public, updatedBy }) {
  const existing = await settingsRepo.findByKey(key);
  if (!existing) throw new NotFoundError(`Setting '${key}' not found`);

  const stored = value === null || value === undefined
    ? null
    : (typeof value === "object" ? JSON.stringify(value) : String(value));

  const saved = await settingsRepo.upsert(key, stored, {
    type: type || existing.type,
    description: description !== undefined ? description : existing.description,
    isPublic: typeof is_public === "boolean" ? is_public : undefined,
    updatedBy,
  });
  return toDto(saved);
}

async function getByKey(key) {
  const row = await settingsRepo.findByKey(key);
  if (!row) throw new NotFoundError(`Setting '${key}' not found`);
  return toDto(row);
}

module.exports = { listAll, updateByKey, getByKey, parseValue };

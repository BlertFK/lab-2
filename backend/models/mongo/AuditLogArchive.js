const mongoose = require("mongoose");

const auditLogArchiveSchema = new mongoose.Schema({
  audit_log_id: { type: Number, required: true, unique: true, index: true },
  user_id: { type: Number, default: null, index: true },
  action: { type: String, default: null, index: true },
  entity: { type: String, default: null, index: true },
  entity_id: { type: Number, default: null, index: true },
  old_value: { type: mongoose.Schema.Types.Mixed, default: null },
  new_value: { type: mongoose.Schema.Types.Mixed, default: null },
  ip_address: { type: String, default: null },
  user_agent: { type: String, default: null },
  created_at: { type: Date, default: null, index: true },
  archived_at: { type: Date, default: Date.now, index: true },
}, {
  collection: "audit_log_archives",
  versionKey: false,
});

auditLogArchiveSchema.index({ entity: 1, entity_id: 1, created_at: -1 });

module.exports = mongoose.model("AuditLogArchive", auditLogArchiveSchema);

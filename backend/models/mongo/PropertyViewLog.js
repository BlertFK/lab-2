const mongoose = require("mongoose");

const propertyViewLogSchema = new mongoose.Schema({
  property_id: { type: Number, required: true, index: true },
  user_id: { type: Number, default: null, index: true },
  ip_address: { type: String, default: null },
  user_agent: { type: String, default: null },
  source: { type: String, default: "property_detail" },
  viewed_at: { type: Date, default: Date.now, index: true },
}, {
  collection: "property_view_logs",
  versionKey: false,
});

propertyViewLogSchema.index({ property_id: 1, viewed_at: -1 });

module.exports = mongoose.model("PropertyViewLog", propertyViewLogSchema);

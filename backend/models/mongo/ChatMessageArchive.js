const mongoose = require("mongoose");

const chatMessageArchiveSchema = new mongoose.Schema({
  message_id: { type: Number, required: true, unique: true, index: true },
  thread_id: { type: Number, default: null, index: true },
  property_id: { type: Number, default: null, index: true },
  buyer_id: { type: Number, default: null, index: true },
  seller_id: { type: Number, default: null, index: true },
  sender_id: { type: Number, default: null, index: true },
  body: { type: String, default: "" },
  attachment_file_id: { type: Number, default: null },
  is_edited: { type: Boolean, default: false },
  edited_at: { type: Date, default: null },
  read_at: { type: Date, default: null },
  created_at: { type: Date, default: null, index: true },
  archived_at: { type: Date, default: Date.now, index: true },
}, {
  collection: "chat_message_archives",
  versionKey: false,
});

chatMessageArchiveSchema.index({ thread_id: 1, created_at: 1 });

module.exports = mongoose.model("ChatMessageArchive", chatMessageArchiveSchema);

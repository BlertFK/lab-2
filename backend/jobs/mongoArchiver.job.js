const cron = require("node-cron");
const db = require("../config/db");
const { isMongoAvailable } = require("../config/mongo");
const ChatMessageArchive = require("../models/mongo/ChatMessageArchive");
const AuditLogArchive = require("../models/mongo/AuditLogArchive");

let archiveTask = null;
let archiveRunning = false;

const hasTable = async (tableName) => {
  const [rows] = await db.query(
    `SELECT TABLE_NAME
     FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [tableName]
  );

  return rows.length > 0;
};

const getColumns = async (tableName) => {
  const [rows] = await db.query(
    `SELECT COLUMN_NAME
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [tableName]
  );

  return new Set(rows.map((row) => row.COLUMN_NAME));
};

const parseJsonValue = (value) => {
  if (!value || typeof value !== "string") return value || null;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const archiveMessages = async ({ days, batchSize }) => {
  if (!(await hasTable("messages"))) return 0;

  const columns = await getColumns("messages");
  const bodySelect = columns.has("body")
    ? "m.body"
    : columns.has("message") ? "m.message AS body" : "'' AS body";
  const optionalSelect = [
    columns.has("message") ? "m.message" : "NULL AS message",
    columns.has("attachment_file_id") ? "m.attachment_file_id" : "NULL AS attachment_file_id",
    columns.has("is_edited") ? "m.is_edited" : "0 AS is_edited",
    columns.has("edited_at") ? "m.edited_at" : "NULL AS edited_at",
    columns.has("read_at") ? "m.read_at" : "NULL AS read_at",
  ].join(", ");

  const [rows] = await db.query(
    `SELECT
       m.id,
       m.thread_id,
       m.sender_id,
       m.buyer_id,
       m.seller_id,
       m.property_id,
       ${bodySelect},
       ${optionalSelect},
       m.created_at
     FROM messages m
     WHERE m.created_at < DATE_SUB(NOW(), INTERVAL ? DAY)
     ORDER BY m.created_at ASC
     LIMIT ?`,
    [days, batchSize]
  );

  if (rows.length === 0) return 0;

  await ChatMessageArchive.bulkWrite(
    rows.map((row) => ({
      updateOne: {
        filter: { message_id: row.id },
        update: {
          $setOnInsert: {
            message_id: row.id,
            thread_id: row.thread_id,
            property_id: row.property_id,
            buyer_id: row.buyer_id,
            seller_id: row.seller_id,
            sender_id: row.sender_id,
            body: row.body || row.message || "",
            attachment_file_id: row.attachment_file_id,
            is_edited: Boolean(row.is_edited),
            edited_at: row.edited_at,
            read_at: row.read_at,
            created_at: row.created_at,
            archived_at: new Date(),
          },
        },
        upsert: true,
      },
    })),
    { ordered: false }
  );

  await db.query(`DELETE FROM messages WHERE id IN (${rows.map(() => "?").join(", ")})`, rows.map((row) => row.id));
  return rows.length;
};

const archiveAuditLogs = async ({ days, batchSize }) => {
  if (!(await hasTable("audit_logs"))) return 0;

  const [rows] = await db.query(
    `SELECT id, user_id, action, entity, entity_id, old_value, new_value, ip_address, user_agent, created_at
     FROM audit_logs
     WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)
     ORDER BY created_at ASC
     LIMIT ?`,
    [days, batchSize]
  );

  if (rows.length === 0) return 0;

  await AuditLogArchive.bulkWrite(
    rows.map((row) => ({
      updateOne: {
        filter: { audit_log_id: row.id },
        update: {
          $setOnInsert: {
            audit_log_id: row.id,
            user_id: row.user_id,
            action: row.action,
            entity: row.entity,
            entity_id: row.entity_id,
            old_value: parseJsonValue(row.old_value),
            new_value: parseJsonValue(row.new_value),
            ip_address: row.ip_address,
            user_agent: row.user_agent,
            created_at: row.created_at,
            archived_at: new Date(),
          },
        },
        upsert: true,
      },
    })),
    { ordered: false }
  );

  await db.query(`DELETE FROM audit_logs WHERE id IN (${rows.map(() => "?").join(", ")})`, rows.map((row) => row.id));
  return rows.length;
};

const runMongoArchiver = async () => {
  if (!isMongoAvailable()) {
    return { skipped: true, reason: "MongoDB is not available." };
  }

  const batchSize = Math.max(Number(process.env.MONGO_ARCHIVE_BATCH_SIZE || 500), 1);
  const messageDays = Math.max(Number(process.env.MONGO_MESSAGE_ARCHIVE_DAYS || 90), 1);
  const auditDays = Math.max(Number(process.env.MONGO_AUDIT_ARCHIVE_DAYS || 180), 1);

  const messagesArchived = await archiveMessages({ days: messageDays, batchSize });
  const auditLogsArchived = await archiveAuditLogs({ days: auditDays, batchSize });

  return {
    skipped: false,
    messagesArchived,
    auditLogsArchived,
  };
};

const startMongoArchiver = () => {
  if (process.env.MONGO_ARCHIVE_ENABLED !== "true" || archiveTask) return;

  const schedule = process.env.MONGO_ARCHIVE_CRON || "0 3 * * *";
  if (!cron.validate(schedule)) {
    console.error(`Mongo archiver cron schedule is invalid: ${schedule}`);
    return;
  }

  archiveTask = cron.schedule(schedule, async () => {
    if (archiveRunning) return;

    archiveRunning = true;
    runMongoArchiver()
      .then((result) => console.log("Mongo archiver result:", result))
      .catch((error) => console.error("Mongo archiver failed:", error.message))
      .finally(() => {
        archiveRunning = false;
      });
  });
};

module.exports = {
  runMongoArchiver,
  startMongoArchiver,
};

const db = require("../config/db");
const socketService = require("./socketService");

let notificationsTableExists = null;

const hasNotificationsTable = async () => {
  if (notificationsTableExists !== null) return notificationsTableExists;

  const [rows] = await db.query(
    `SELECT TABLE_NAME
     FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications'`
  );

  notificationsTableExists = rows.length > 0;
  return notificationsTableExists;
};

const createNotification = async ({
  user_id,
  type,
  title,
  message,
  link = null,
  payload = null,
}) => {
  if (!user_id) return null;

  let notification = {
    id: null,
    user_id,
    type,
    title,
    message,
    link,
    is_read: false,
    created_at: new Date().toISOString(),
    payload,
  };

  try {
    if (await hasNotificationsTable()) {
      const [result] = await db.query(
        `INSERT INTO notifications (user_id, type, title, message, link, is_read)
         VALUES (?, ?, ?, ?, ?, 0)`,
        [user_id, type, title, message, link]
      );

      notification = {
        ...notification,
        id: result.insertId,
      };
    }
  } catch (error) {
    console.error("Notification write failed:", error.message);
  }

  socketService.emitToUser(user_id, "notification:new", { notification });
  return notification;
};

const notifyUsers = async (userIds, notification) => Promise.all(
  [...new Set((userIds || []).filter(Boolean))].map((userId) => createNotification({
    ...notification,
    user_id: userId,
  }))
);

module.exports = {
  createNotification,
  notifyUsers,
};

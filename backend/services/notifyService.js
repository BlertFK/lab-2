const notificationService = require("./notificationService");

const createNotification = (notification) => notificationService.createNotification(notification);

const notifyUsers = (userIds, notification) => notificationService.notifyUsers(userIds, notification);

module.exports = {
  createNotification,
  notifyUsers,
};

const Notification = require('../models/Notification');

const createNotification = async ({ user, type = 'system', title, message, entityType, entityId }) => {
  if (!user || !title || !message) return null;

  return Notification.create({
    user,
    type,
    title,
    message,
    entityType,
    entityId
  });
};

module.exports = createNotification;

const Notification = require('../models/Notification');

const notify = async ({ user, title, message, type = 'info', module = '', link = '' }) => {
  return Notification.create({ user, title, message, type, module, link });
};

// Notify multiple users
const notifyMany = async (userIds, { title, message, type = 'info', module = '', link = '' }) => {
  const docs = userIds.map(user => ({ user, title, message, type, module, link }));
  return Notification.insertMany(docs);
};

module.exports = { notify, notifyMany };

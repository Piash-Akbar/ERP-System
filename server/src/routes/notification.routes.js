const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/notification.controller');
const { protect } = require('../middlewares/auth');

router.use(protect); // all routes protected
router.get('/', ctrl.getNotifications);
router.get('/unread-count', ctrl.getUnreadCount);
router.put('/mark-all-read', ctrl.markAllAsRead);
router.put('/:id', ctrl.markAsRead);
router.delete('/:id', ctrl.deleteNotification);
// Note: Notification mutations are user-scoped (mark-read, delete own) — activity logging not needed here

module.exports = router;

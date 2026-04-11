const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/activityLog.controller');
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/authorize');

router.use(protect);

router.get('/', authorize('activity_log', 'view'), ctrl.getActivityLogs);

module.exports = router;

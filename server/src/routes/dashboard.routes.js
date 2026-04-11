const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/dashboard.controller');
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/authorize');

router.use(protect);

router.get('/summary', authorize('dashboard', 'view'), ctrl.getSummary);
router.get('/chart', authorize('dashboard', 'view'), ctrl.getChartData);

module.exports = router;

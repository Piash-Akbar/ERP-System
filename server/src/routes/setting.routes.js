const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/setting.controller');
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/authorize');
const { uploadLogo } = require('../middlewares/upload');

// Public route — no auth needed (for theme/logo/company name)
router.get('/public', ctrl.getPublicSettings);

// Protected routes
router.use(protect);

router.get('/', authorize('settings', 'view'), ctrl.getAll);
router.get('/group/:group', authorize('settings', 'view'), ctrl.getByGroup);
router.put('/', authorize('settings', 'edit'), ctrl.bulkUpsert);
router.post('/upload-logo', authorize('settings', 'edit'), uploadLogo, ctrl.uploadLogo);

module.exports = router;

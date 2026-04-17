const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/asset.controller');
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/authorize');
const { logActivity } = require('../middlewares/activityLogger');
const { validate } = require('../middlewares/validate');
const {
  createAssetSchema, updateAssetSchema, maintenanceSchema,
  disposeSchema, assignSchema, transferSchema,
} = require('../validators/asset.validator');

router.use(protect);

router.get('/summary', authorize('assets', 'view'), ctrl.getAssetSummary);
router.post('/run-depreciation', authorize('assets', 'edit'), logActivity('assets', 'Ran depreciation batch'), ctrl.runDepreciation);

router
  .route('/')
  .get(authorize('assets', 'view'), ctrl.getAssets)
  .post(authorize('assets', 'create'), validate(createAssetSchema), logActivity('assets', 'Registered asset'), ctrl.createAsset);

router
  .route('/:id')
  .get(authorize('assets', 'view'), ctrl.getAsset)
  .put(authorize('assets', 'edit'), validate(updateAssetSchema), logActivity('assets', 'Updated asset'), ctrl.updateAsset)
  .delete(authorize('assets', 'delete'), logActivity('assets', 'Deleted asset'), ctrl.deleteAsset);

router.put('/:id/assign', authorize('assets', 'edit'), validate(assignSchema), logActivity('assets', 'Assigned asset'), ctrl.assignAsset);
router.put('/:id/transfer', authorize('assets', 'edit'), validate(transferSchema), logActivity('assets', 'Transferred asset'), ctrl.transferAsset);
router.post('/:id/maintenance', authorize('assets', 'edit'), validate(maintenanceSchema), logActivity('assets', 'Added maintenance'), ctrl.addMaintenance);
router.post('/:id/dispose', authorize('assets', 'approve'), validate(disposeSchema), logActivity('assets', 'Disposed asset'), ctrl.disposeAsset);

module.exports = router;

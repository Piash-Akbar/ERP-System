const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/approval.controller');
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/authorize');
const { logActivity } = require('../middlewares/activityLogger');
const { validate } = require('../middlewares/validate');
const { createRuleSchema, updateRuleSchema } = require('../validators/approval.validator');

router.use(protect);

router
  .route('/')
  .get(authorize('approvals', 'view'), ctrl.getRules)
  .post(authorize('approvals', 'create'), validate(createRuleSchema), logActivity('approvals', 'Created approval rule'), ctrl.createRule);

router
  .route('/:id')
  .get(authorize('approvals', 'view'), ctrl.getRule)
  .put(authorize('approvals', 'edit'), validate(updateRuleSchema), logActivity('approvals', 'Updated approval rule'), ctrl.updateRule)
  .delete(authorize('approvals', 'delete'), logActivity('approvals', 'Deleted approval rule'), ctrl.deleteRule);

module.exports = router;

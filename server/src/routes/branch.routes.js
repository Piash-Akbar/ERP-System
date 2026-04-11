const express = require('express');
const router = express.Router();
const branchController = require('../controllers/branch.controller');
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/authorize');
const { logActivity } = require('../middlewares/activityLogger');
const { validate } = require('../middlewares/validate');
const { createBranchSchema, updateBranchSchema } = require('../validators/location.validator');

router.use(protect);
router.use(authorize('locations', 'view'));

router.get('/', branchController.getBranches);
router.get('/:id', branchController.getBranch);

router.post(
  '/',
  authorize('locations', 'create'),
  validate(createBranchSchema),
  logActivity('locations', 'Created branch'),
  branchController.createBranch
);

router.put(
  '/:id',
  authorize('locations', 'edit'),
  validate(updateBranchSchema),
  logActivity('locations', 'Updated branch'),
  branchController.updateBranch
);

router.delete(
  '/:id',
  authorize('locations', 'delete'),
  logActivity('locations', 'Deleted branch'),
  branchController.deleteBranch
);

module.exports = router;

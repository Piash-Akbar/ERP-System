const express = require('express');
const router = express.Router();
const branchController = require('../controllers/branch.controller');
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/authorize');
const { validate } = require('../middlewares/validate');
const { createBranchSchema, updateBranchSchema } = require('../validators/location.validator');

router.use(protect);
router.use(authorize('locations', 'read'));

router.get('/', branchController.getBranches);
router.get('/:id', branchController.getBranch);

router.post(
  '/',
  authorize('locations', 'create'),
  validate(createBranchSchema),
  branchController.createBranch
);

router.put(
  '/:id',
  authorize('locations', 'update'),
  validate(updateBranchSchema),
  branchController.updateBranch
);

router.delete(
  '/:id',
  authorize('locations', 'delete'),
  branchController.deleteBranch
);

module.exports = router;

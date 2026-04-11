const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/transfer.controller');
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/authorize');
const { logActivity } = require('../middlewares/activityLogger');
const { validate } = require('../middlewares/validate');
const { createMoneyTransferSchema } = require('../validators/transfer.validator');

router.use(protect);

router.get('/', authorize('transfer', 'view'), ctrl.getMoneyTransfers);
router.post('/', authorize('transfer', 'create'), validate(createMoneyTransferSchema), logActivity('transfer', 'Created money transfer'), ctrl.createMoneyTransfer);
router.delete('/:id', authorize('transfer', 'delete'), logActivity('transfer', 'Deleted money transfer'), ctrl.deleteMoneyTransfer);

module.exports = router;

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/transfer.controller');
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/authorize');

router.use(protect);

router.get('/', authorize('transfer', 'view'), ctrl.getMoneyTransfers);
router.post('/', authorize('transfer', 'create'), ctrl.createMoneyTransfer);
router.delete('/:id', authorize('transfer', 'delete'), ctrl.deleteMoneyTransfer);

module.exports = router;

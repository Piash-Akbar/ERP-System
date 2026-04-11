const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/sale.controller');
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/authorize');

router.use(protect);

router.get('/', authorize('sales', 'view'), ctrl.getSales);
router.get('/:id', authorize('sales', 'view'), ctrl.getSale);
router.post('/', authorize('sales', 'create'), ctrl.createSale);
router.post('/:id/payment', authorize('sales', 'edit'), ctrl.addPayment);
router.post('/:id/return', authorize('sales', 'create'), ctrl.createReturn);
router.put('/:id/status', authorize('sales', 'edit'), ctrl.updateSaleStatus);
router.delete('/:id', authorize('sales', 'delete'), ctrl.deleteSale);

module.exports = router;

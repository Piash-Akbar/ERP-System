const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/sale.controller');
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/authorize');
const { logActivity } = require('../middlewares/activityLogger');
const { validate } = require('../middlewares/validate');
const { createSaleSchema, addPaymentSchema, updateSaleStatusSchema } = require('../validators/sale.validator');

router.use(protect);

router.get('/', authorize('sales', 'view'), ctrl.getSales);
router.get('/:id', authorize('sales', 'view'), ctrl.getSale);
router.post('/', authorize('sales', 'create'), validate(createSaleSchema), logActivity('sales', 'Created sale'), ctrl.createSale);
router.post('/:id/payment', authorize('sales', 'edit'), validate(addPaymentSchema), logActivity('sales', 'Added payment'), ctrl.addPayment);
router.post('/:id/return', authorize('sales', 'create'), logActivity('sales', 'Created return'), ctrl.createReturn);
router.put('/:id/status', authorize('sales', 'edit'), validate(updateSaleStatusSchema), logActivity('sales', 'Updated sale status'), ctrl.updateSaleStatus);
router.delete('/:id', authorize('sales', 'delete'), logActivity('sales', 'Deleted sale'), ctrl.deleteSale);

module.exports = router;

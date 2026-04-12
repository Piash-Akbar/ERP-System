const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/purchase.controller');
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/authorize');
const { logActivity } = require('../middlewares/activityLogger');
const { validate } = require('../middlewares/validate');
const { createPurchaseSchema, addPaymentSchema, updatePurchaseStatusSchema, createReturnSchema } = require('../validators/purchase.validator');
const { uploadPurchaseDocuments } = require('../middlewares/upload');

router.use(protect);

router.get('/', authorize('purchase', 'view'), ctrl.getPurchases);
router.get('/:id', authorize('purchase', 'view'), ctrl.getPurchase);
router.post('/', authorize('purchase', 'create'), uploadPurchaseDocuments, validate(createPurchaseSchema), logActivity('purchase', 'Created purchase'), ctrl.createPurchase);
router.post('/:id/documents', authorize('purchase', 'edit'), logActivity('purchase', 'Uploaded documents'), uploadPurchaseDocuments, ctrl.uploadDocuments);
router.delete('/:id/documents', authorize('purchase', 'edit'), logActivity('purchase', 'Deleted document'), ctrl.deleteDocument);
router.post('/:id/payment', authorize('purchase', 'edit'), validate(addPaymentSchema), logActivity('purchase', 'Added payment'), ctrl.addPayment);
router.post('/:id/return', authorize('purchase', 'create'), validate(createReturnSchema), logActivity('purchase', 'Created return'), ctrl.createReturn);
router.put('/:id/status', authorize('purchase', 'edit'), validate(updatePurchaseStatusSchema), logActivity('purchase', 'Updated purchase status'), ctrl.updatePurchaseStatus);
router.delete('/:id', authorize('purchase', 'delete'), logActivity('purchase', 'Deleted purchase'), ctrl.deletePurchase);

module.exports = router;

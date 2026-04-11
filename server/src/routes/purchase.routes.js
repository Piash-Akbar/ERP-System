const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/purchase.controller');
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/authorize');
const { uploadPurchaseDocuments } = require('../middlewares/upload');

router.use(protect);

router.get('/', authorize('purchase', 'view'), ctrl.getPurchases);
router.get('/:id', authorize('purchase', 'view'), ctrl.getPurchase);
router.post('/', authorize('purchase', 'create'), uploadPurchaseDocuments, ctrl.createPurchase);
router.post('/:id/documents', authorize('purchase', 'edit'), uploadPurchaseDocuments, ctrl.uploadDocuments);
router.delete('/:id/documents', authorize('purchase', 'edit'), ctrl.deleteDocument);
router.post('/:id/payment', authorize('purchase', 'edit'), ctrl.addPayment);
router.post('/:id/return', authorize('purchase', 'create'), ctrl.createReturn);
router.put('/:id/status', authorize('purchase', 'edit'), ctrl.updatePurchaseStatus);
router.delete('/:id', authorize('purchase', 'delete'), ctrl.deletePurchase);

module.exports = router;

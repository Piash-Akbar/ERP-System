const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/cnf.controller');
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/authorize');
const { logActivity } = require('../middlewares/activityLogger');
const { validate } = require('../middlewares/validate');
const { createCNFSchema, updateCNFSchema } = require('../validators/cnf.validator');
const { uploadCNFDocuments } = require('../middlewares/upload');

router.use(protect);

router.get('/', authorize('cnf', 'view'), ctrl.getCNFs);
router.get('/:id', authorize('cnf', 'view'), ctrl.getCNF);
router.post('/', authorize('cnf', 'create'), uploadCNFDocuments, validate(createCNFSchema), logActivity('cnf', 'Created CNF'), ctrl.createCNF);
router.put('/:id', authorize('cnf', 'edit'), uploadCNFDocuments, validate(updateCNFSchema), logActivity('cnf', 'Updated CNF'), ctrl.updateCNF);
router.delete('/:id/documents', authorize('cnf', 'edit'), logActivity('cnf', 'Deleted CNF document'), ctrl.deleteDocument);
router.delete('/:id', authorize('cnf', 'delete'), logActivity('cnf', 'Deleted CNF'), ctrl.deleteCNF);

module.exports = router;

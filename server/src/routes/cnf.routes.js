const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/cnf.controller');
const { protect } = require('../middlewares/auth');
const { uploadCNFDocuments } = require('../middlewares/upload');

router.use(protect);

router.get('/', ctrl.getCNFs);
router.get('/:id', ctrl.getCNF);
router.post('/', uploadCNFDocuments, ctrl.createCNF);
router.put('/:id', uploadCNFDocuments, ctrl.updateCNF);
router.delete('/:id/documents', ctrl.deleteDocument);
router.delete('/:id', ctrl.deleteCNF);

module.exports = router;

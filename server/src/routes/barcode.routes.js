const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/barcode.controller');
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/authorize');
const { logActivity } = require('../middlewares/activityLogger');
const { validate } = require('../middlewares/validate');
const { generateSchema, generateBulkSchema, assignSchema, logPrintSchema } = require('../validators/barcode.validator');

router.use(protect);

router.get('/stats', authorize('barcodes', 'view'), ctrl.getDashboardStats);
router.get('/unassigned', authorize('barcodes', 'view'), ctrl.getUnassigned);
router.get('/check-duplicate', authorize('barcodes', 'view'), ctrl.checkDuplicate);
router.get('/print-data', authorize('barcodes', 'view'), ctrl.getPrintData);
router.get('/lookup/:code', authorize('barcodes', 'view'), ctrl.lookup);
router.get('/', authorize('barcodes', 'view'), ctrl.getAll);

router.post('/generate', authorize('barcodes', 'create'), validate(generateSchema), logActivity('barcodes', 'Generated barcode'), ctrl.generate);
router.post('/generate-bulk', authorize('barcodes', 'create'), validate(generateBulkSchema), logActivity('barcodes', 'Bulk generated barcodes'), ctrl.generateBulk);
router.put('/assign', authorize('barcodes', 'edit'), validate(assignSchema), logActivity('barcodes', 'Assigned barcode'), ctrl.assign);
router.post('/log-print', authorize('barcodes', 'view'), validate(logPrintSchema), ctrl.logPrint);

module.exports = router;

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/document.controller');
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/authorize');
const { logActivity } = require('../middlewares/activityLogger');
const { validate } = require('../middlewares/validate');
const { updateDocumentSchema, linkDocumentSchema } = require('../validators/document.validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer config for document uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../uploads/documents');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

router.use(protect);

router.get('/', authorize('documents', 'view'), ctrl.getDocuments);
router.get('/expiring', authorize('documents', 'view'), ctrl.getExpiringDocuments);
router.get('/linked/:module/:id', authorize('documents', 'view'), ctrl.getLinkedDocuments);
router.get('/:id', authorize('documents', 'view'), ctrl.getDocument);
router.get('/:id/download', authorize('documents', 'view'), ctrl.downloadDocument);
router.get('/:id/preview', authorize('documents', 'view'), ctrl.previewDocument);

router.post('/', authorize('documents', 'create'), upload.single('file'), logActivity('documents', 'Uploaded document'), ctrl.uploadDocument);
router.post('/:id/new-version', authorize('documents', 'edit'), upload.single('file'), logActivity('documents', 'Uploaded new version'), ctrl.uploadNewVersion);
router.post('/:id/link', authorize('documents', 'edit'), validate(linkDocumentSchema), ctrl.linkDocument);

router.put('/:id', authorize('documents', 'edit'), validate(updateDocumentSchema), logActivity('documents', 'Updated document'), ctrl.updateDocument);
router.delete('/:id', authorize('documents', 'delete'), logActivity('documents', 'Deleted document'), ctrl.deleteDocument);

module.exports = router;

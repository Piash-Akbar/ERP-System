const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadsDir = path.join(__dirname, '../../uploads');

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  },
});

// Allowed MIME types
const imageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
const documentTypes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
];
const allAllowedTypes = [...imageTypes, ...documentTypes];

// File filters
const imageFilter = (req, file, cb) => {
  if (imageTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname), false);
  }
};

const documentFilter = (req, file, cb) => {
  if (allAllowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname), false);
  }
};

// Logo upload — single image, 2MB max
const uploadLogo = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
}).single('logo');

// Product image — single image, 5MB max
const uploadProductImage = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).single('image');

// Purchase documents — up to 5 files, 10MB each
const uploadPurchaseDocuments = multer({
  storage,
  fileFilter: documentFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
}).array('documents', 5);

// CNF documents — up to 5 files, 10MB each
const uploadCNFDocuments = multer({
  storage,
  fileFilter: documentFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
}).array('documents', 5);

// Transaction attachments — up to 3 files, 10MB each
const uploadTransactionAttachments = multer({
  storage,
  fileFilter: documentFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
}).array('attachments', 3);

// Helper to delete uploaded files (used for cleanup on errors)
const deleteFiles = (filePaths) => {
  for (const filePath of filePaths) {
    const fullPath = path.join(uploadsDir, path.basename(filePath));
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  }
};

module.exports = {
  uploadLogo,
  uploadProductImage,
  uploadPurchaseDocuments,
  uploadCNFDocuments,
  uploadTransactionAttachments,
  deleteFiles,
};

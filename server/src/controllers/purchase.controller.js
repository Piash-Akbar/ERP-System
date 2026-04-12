const asyncHandler = require('../utils/asyncHandler');
const purchaseService = require('../services/purchase.service');
const { deleteFiles } = require('../middlewares/upload');

exports.getPurchases = asyncHandler(async (req, res) => {
  const result = await purchaseService.getAll(req.query);
  res.json({ success: true, data: result, message: 'Purchases retrieved' });
});

exports.getPurchase = asyncHandler(async (req, res) => {
  const purchase = await purchaseService.getById(req.params.id);
  res.json({ success: true, data: purchase, message: 'Purchase retrieved' });
});

exports.createPurchase = asyncHandler(async (req, res) => {
  if (req.files && req.files.length > 0) {
    req.body.documents = req.files.map((f) => `/uploads/${f.filename}`);
  }
  const purchase = await purchaseService.create(req.body, req.user._id);
  res.status(201).json({ success: true, data: purchase, message: 'Purchase created' });
});

exports.uploadDocuments = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, message: 'No files uploaded' });
  }
  const newDocs = req.files.map((f) => `/uploads/${f.filename}`);
  const purchase = await purchaseService.addDocuments(req.params.id, newDocs);
  res.json({ success: true, data: purchase, message: 'Documents uploaded' });
});

exports.deleteDocument = asyncHandler(async (req, res) => {
  const { filePath } = req.body;
  if (!filePath) {
    return res.status(400).json({ success: false, message: 'File path is required' });
  }
  deleteFiles([filePath]);
  const purchase = await purchaseService.removeDocument(req.params.id, filePath);
  res.json({ success: true, data: purchase, message: 'Document deleted' });
});

exports.addPayment = asyncHandler(async (req, res) => {
  const purchase = await purchaseService.addPayment(req.params.id, req.body);
  res.json({ success: true, data: purchase, message: 'Payment added' });
});

exports.createReturn = asyncHandler(async (req, res) => {
  const returnPurchase = await purchaseService.createReturn(req.params.id, req.body.items, req.user._id, req.body.note);
  res.status(201).json({ success: true, data: returnPurchase, message: 'Return created' });
});

exports.updatePurchaseStatus = asyncHandler(async (req, res) => {
  const Purchase = require('../models/Purchase');
  const purchase = await Purchase.findOneAndUpdate(
    { _id: req.params.id, isDeleted: false },
    { status: req.body.status },
    { new: true, runValidators: true }
  ).populate('supplier');
  if (!purchase) { const err = new Error('Purchase not found'); err.statusCode = 404; throw err; }
  res.json({ success: true, data: purchase, message: 'Purchase status updated' });
});

exports.deletePurchase = asyncHandler(async (req, res) => {
  await purchaseService.deletePurchase(req.params.id);
  res.json({ success: true, data: null, message: 'Purchase deleted' });
});

const asyncHandler = require('../utils/asyncHandler');
const cnfService = require('../services/cnf.service');
const { deleteFiles } = require('../middlewares/upload');

exports.getCNFs = asyncHandler(async (req, res) => {
  const result = await cnfService.getAll(req.query);
  res.json({ success: true, data: result, message: 'CNF entries retrieved' });
});

exports.getCNF = asyncHandler(async (req, res) => {
  const cnf = await cnfService.getById(req.params.id);
  res.json({ success: true, data: cnf, message: 'CNF entry retrieved' });
});

exports.createCNF = asyncHandler(async (req, res) => {
  if (req.files && req.files.length > 0) {
    req.body.documents = req.files.map((f) => `/uploads/${f.filename}`);
  }
  const cnf = await cnfService.create(req.body);
  res.status(201).json({ success: true, data: cnf, message: 'CNF entry created' });
});

exports.updateCNF = asyncHandler(async (req, res) => {
  if (req.files && req.files.length > 0) {
    const newDocs = req.files.map((f) => `/uploads/${f.filename}`);
    // Append new documents to existing ones
    const existing = await cnfService.getById(req.params.id);
    req.body.documents = [...(existing.documents || []), ...newDocs];
  }
  const cnf = await cnfService.update(req.params.id, req.body);
  res.json({ success: true, data: cnf, message: 'CNF entry updated' });
});

exports.deleteCNF = asyncHandler(async (req, res) => {
  await cnfService.remove(req.params.id);
  res.json({ success: true, data: null, message: 'CNF entry deleted' });
});

exports.deleteDocument = asyncHandler(async (req, res) => {
  const { filePath } = req.body;
  if (!filePath) {
    return res.status(400).json({ success: false, message: 'File path is required' });
  }
  deleteFiles([filePath]);
  const cnf = await cnfService.removeDocument(req.params.id, filePath);
  res.json({ success: true, data: cnf, message: 'Document deleted' });
});

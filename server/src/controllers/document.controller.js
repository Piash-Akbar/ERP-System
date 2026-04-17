const asyncHandler = require('../utils/asyncHandler');
const documentService = require('../services/document.service');
const path = require('path');

const getDocuments = asyncHandler(async (req, res) => {
  const result = await documentService.getAll(req.query);
  res.json({ success: true, data: result, message: 'Documents retrieved' });
});

const getDocument = asyncHandler(async (req, res) => {
  const doc = await documentService.getById(req.params.id);
  res.json({ success: true, data: doc, message: 'Document retrieved' });
});

const uploadDocument = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No file uploaded' });
  }
  const doc = await documentService.upload(req.file, req.body, req.user._id);
  res.status(201).json({ success: true, data: doc, message: 'Document uploaded' });
});

const updateDocument = asyncHandler(async (req, res) => {
  const doc = await documentService.update(req.params.id, req.body);
  res.json({ success: true, data: doc, message: 'Document updated' });
});

const uploadNewVersion = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No file uploaded' });
  }
  const doc = await documentService.uploadNewVersion(req.params.id, req.file, req.user._id);
  res.status(201).json({ success: true, data: doc, message: 'New version uploaded' });
});

const downloadDocument = asyncHandler(async (req, res) => {
  const doc = await documentService.getById(req.params.id);
  const filePath = path.resolve(doc.filePath);
  res.download(filePath, doc.fileName);
});

const previewDocument = asyncHandler(async (req, res) => {
  const doc = await documentService.getById(req.params.id);
  const filePath = path.resolve(doc.filePath);
  res.setHeader('Content-Type', doc.mimeType);
  res.setHeader('Content-Disposition', 'inline');
  res.sendFile(filePath);
});

const getLinkedDocuments = asyncHandler(async (req, res) => {
  const docs = await documentService.getLinkedDocuments(req.params.module, req.params.id);
  res.json({ success: true, data: docs, message: 'Linked documents retrieved' });
});

const linkDocument = asyncHandler(async (req, res) => {
  const doc = await documentService.linkToRecord(req.params.id, req.body.linkedModule, req.body.linkedModel, req.body.linkedId);
  res.json({ success: true, data: doc, message: 'Document linked' });
});

const getExpiringDocuments = asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days) || 30;
  const docs = await documentService.getExpiring(days);
  res.json({ success: true, data: docs, message: 'Expiring documents retrieved' });
});

const deleteDocument = asyncHandler(async (req, res) => {
  await documentService.remove(req.params.id);
  res.json({ success: true, data: null, message: 'Document deleted' });
});

module.exports = {
  getDocuments, getDocument, uploadDocument, updateDocument, uploadNewVersion,
  downloadDocument, previewDocument, getLinkedDocuments, linkDocument, getExpiringDocuments, deleteDocument,
};

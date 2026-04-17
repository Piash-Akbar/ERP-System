const Document = require('../models/Document');
const ApiError = require('../utils/apiError');
const { paginate } = require('../utils/pagination');

const getAll = async (query = {}) => {
  const { page, limit, search, category, status, linkedModule, tags } = query;
  const filter = { isDeleted: false, isLatestVersion: true };

  if (category) filter.category = category;
  if (status) filter.status = status;
  if (linkedModule) filter.linkedModule = linkedModule;
  if (tags) {
    const tagList = typeof tags === 'string' ? tags.split(',').map((t) => t.trim()) : tags;
    filter.tags = { $in: tagList };
  }
  if (search) {
    const regex = new RegExp(search, 'i');
    filter.$or = [{ title: regex }, { description: regex }, { tags: regex }];
  }

  return paginate(Document, filter, {
    page,
    limit,
    populate: [{ path: 'uploadedBy', select: 'name' }],
    sort: { createdAt: -1 },
  });
};

const getById = async (id) => {
  const doc = await Document.findOne({ _id: id, isDeleted: false })
    .populate('uploadedBy', 'name email')
    .populate('previousVersion', 'title version fileName createdAt')
    .populate('accessRoles', 'name')
    .populate('branch', 'name')
    .lean();
  if (!doc) throw new ApiError('Document not found', 404);
  return doc;
};

const upload = async (file, data, userId) => {
  let tags = data.tags || [];
  if (typeof tags === 'string') {
    tags = tags.split(',').map((t) => t.trim()).filter(Boolean);
  }

  const doc = await Document.create({
    title: data.title,
    description: data.description || '',
    fileName: file.originalname,
    filePath: file.path,
    fileSize: file.size,
    mimeType: file.mimetype,
    category: data.category,
    tags,
    linkedModule: data.linkedModule || undefined,
    linkedModel: data.linkedModel || undefined,
    linkedId: data.linkedId || undefined,
    expiryDate: data.expiryDate || undefined,
    accessRoles: data.accessRoles || [],
    branch: data.branch || undefined,
    uploadedBy: userId,
  });

  return doc;
};

const update = async (id, data) => {
  if (data.tags && typeof data.tags === 'string') {
    data.tags = data.tags.split(',').map((t) => t.trim()).filter(Boolean);
  }

  const doc = await Document.findOneAndUpdate(
    { _id: id, isDeleted: false },
    data,
    { new: true, runValidators: true }
  );
  if (!doc) throw new ApiError('Document not found', 404);
  return doc;
};

const uploadNewVersion = async (id, file, userId) => {
  const existing = await Document.findOne({ _id: id, isDeleted: false });
  if (!existing) throw new ApiError('Document not found', 404);

  existing.isLatestVersion = false;
  await existing.save();

  const newDoc = await Document.create({
    title: existing.title,
    description: existing.description,
    fileName: file.originalname,
    filePath: file.path,
    fileSize: file.size,
    mimeType: file.mimetype,
    category: existing.category,
    tags: existing.tags,
    linkedModule: existing.linkedModule,
    linkedModel: existing.linkedModel,
    linkedId: existing.linkedId,
    expiryDate: existing.expiryDate,
    accessRoles: existing.accessRoles,
    branch: existing.branch,
    uploadedBy: userId,
    version: existing.version + 1,
    previousVersion: existing._id,
    isLatestVersion: true,
  });

  return newDoc;
};

const getLinkedDocuments = async (module, recordId) => {
  return Document.find({
    linkedModule: module,
    linkedId: recordId,
    isDeleted: false,
    isLatestVersion: true,
  })
    .populate('uploadedBy', 'name')
    .sort({ createdAt: -1 })
    .lean();
};

const linkToRecord = async (id, linkedModule, linkedModel, linkedId) => {
  const doc = await Document.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { linkedModule, linkedModel, linkedId },
    { new: true }
  );
  if (!doc) throw new ApiError('Document not found', 404);
  return doc;
};

const getExpiring = async (days = 30) => {
  const futureDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  return Document.find({
    expiryDate: { $lte: futureDate, $gte: new Date() },
    status: { $ne: 'expired' },
    isDeleted: false,
    isLatestVersion: true,
  })
    .populate('uploadedBy', 'name')
    .sort({ expiryDate: 1 })
    .lean();
};

const remove = async (id) => {
  const doc = await Document.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { isDeleted: true },
    { new: true }
  );
  if (!doc) throw new ApiError('Document not found', 404);
  return doc;
};

module.exports = { getAll, getById, upload, update, uploadNewVersion, getLinkedDocuments, linkToRecord, getExpiring, remove };

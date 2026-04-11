const CNF = require('../models/CNF');
const ApiError = require('../utils/apiError');
const { paginate } = require('../utils/pagination');

const getAll = async (query) => {
  const filter = { isDeleted: false };
  if (query.status) filter.status = query.status;
  if (query.search) {
    filter.$or = [
      { agent: { $regex: query.search, $options: 'i' } },
      { lcNumber: { $regex: query.search, $options: 'i' } },
    ];
  }

  return paginate(CNF, filter, {
    page: query.page,
    limit: query.limit,
    sort: { createdAt: -1 },
    populate: [{ path: 'purchase', select: 'referenceNo' }],
  });
};

const getById = async (id) => {
  const cnf = await CNF.findById(id).populate('purchase', 'referenceNo supplier');
  if (!cnf || cnf.isDeleted) throw new ApiError('CNF entry not found', 404);
  return cnf;
};

const create = async (data) => {
  return CNF.create(data);
};

const update = async (id, data) => {
  const cnf = await CNF.findById(id);
  if (!cnf || cnf.isDeleted) throw new ApiError('CNF entry not found', 404);
  Object.assign(cnf, data);
  await cnf.save();
  return cnf;
};

const remove = async (id) => {
  const cnf = await CNF.findById(id);
  if (!cnf) throw new ApiError('CNF entry not found', 404);
  cnf.isDeleted = true;
  await cnf.save();
  return cnf;
};

const removeDocument = async (id, filePath) => {
  const cnf = await CNF.findOne({ _id: id, isDeleted: false });
  if (!cnf) throw new ApiError('CNF entry not found', 404);
  cnf.documents = cnf.documents.filter((doc) => doc !== filePath);
  await cnf.save();
  return cnf;
};

module.exports = { getAll, getById, create, update, remove, removeDocument };

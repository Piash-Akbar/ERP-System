const Unit = require('../models/Unit');
const ApiError = require('../utils/apiError');

const getAll = async () => {
  return Unit.find({ isDeleted: false }).sort({ name: 1 }).lean();
};

const create = async (data) => {
  return Unit.create(data);
};

const update = async (id, data) => {
  const unit = await Unit.findOneAndUpdate(
    { _id: id, isDeleted: false },
    data,
    { new: true, runValidators: true }
  );
  if (!unit) throw new ApiError('Unit not found', 404);
  return unit;
};

const remove = async (id) => {
  const unit = await Unit.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { isDeleted: true },
    { new: true }
  );
  if (!unit) throw new ApiError('Unit not found', 404);
  return unit;
};

module.exports = { getAll, create, update, remove };

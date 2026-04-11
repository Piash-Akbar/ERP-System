const Contact = require('../models/Contact');
const ApiError = require('../utils/apiError');
const { paginate } = require('../utils/pagination');

const getAll = async (query = {}) => {
  const { page, limit, search, type } = query;

  const filter = { isDeleted: false };

  if (type) {
    filter.type = type;
  }

  if (search) {
    const regex = new RegExp(search, 'i');
    filter.$or = [
      { name: regex },
      { company: regex },
      { email: regex },
      { phone: regex },
    ];
  }

  return paginate(Contact, filter, { page, limit });
};

const getById = async (id) => {
  const contact = await Contact.findOne({ _id: id, isDeleted: false }).lean();
  if (!contact) {
    throw new ApiError('Contact not found', 404);
  }
  return contact;
};

const create = async (data) => {
  const contact = await Contact.create(data);
  return contact;
};

const update = async (id, data) => {
  const contact = await Contact.findOneAndUpdate(
    { _id: id, isDeleted: false },
    data,
    { new: true, runValidators: true }
  );
  if (!contact) {
    throw new ApiError('Contact not found', 404);
  }
  return contact;
};

const remove = async (id) => {
  const contact = await Contact.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { isDeleted: true },
    { new: true }
  );
  if (!contact) {
    throw new ApiError('Contact not found', 404);
  }
  return contact;
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
};

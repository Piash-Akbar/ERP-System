const User = require('../models/User');
const ApiError = require('../utils/apiError');
const { paginate } = require('../utils/pagination');
const { ROLES } = require('../config/constants');

const getAll = async (query = {}) => {
  const { page, limit, search, role, branch, isActive } = query;

  const filter = { isDeleted: false };

  if (role) filter.role = role;
  if (branch) filter.branch = branch;
  if (isActive !== undefined && isActive !== '') {
    filter.isActive = isActive === 'true' || isActive === true;
  }

  if (search) {
    const regex = new RegExp(search, 'i');
    filter.$or = [{ name: regex }, { email: regex }, { phone: regex }];
  }

  return paginate(User, filter, {
    page,
    limit,
    populate: [
      { path: 'role', select: 'name' },
      { path: 'branch', select: 'name' },
    ],
    sort: { createdAt: -1 },
  });
};

const getById = async (id) => {
  const user = await User.findOne({ _id: id, isDeleted: false })
    .populate('role')
    .populate('branch', 'name address')
    .lean();
  if (!user) throw new ApiError('User not found', 404);
  return user;
};

const create = async (data) => {
  const existing = await User.findOne({ email: data.email, isDeleted: false });
  if (existing) throw new ApiError('Email already in use', 400);

  const user = await User.create(data);
  return User.findById(user._id)
    .populate('role', 'name')
    .populate('branch', 'name')
    .lean();
};

const update = async (id, data) => {
  if (data.email) {
    const existing = await User.findOne({
      email: data.email,
      _id: { $ne: id },
      isDeleted: false,
    });
    if (existing) throw new ApiError('Email already in use', 400);
  }

  const user = await User.findOneAndUpdate(
    { _id: id, isDeleted: false },
    data,
    { new: true, runValidators: true }
  )
    .populate('role', 'name')
    .populate('branch', 'name');

  if (!user) throw new ApiError('User not found', 404);
  return user;
};

const toggleStatus = async (id, isActive) => {
  const user = await User.findOne({ _id: id, isDeleted: false }).populate('role');
  if (!user) throw new ApiError('User not found', 404);

  if (!isActive && user.role?.name === ROLES.SUPER_ADMIN) {
    const superAdminCount = await User.countDocuments({
      isDeleted: false,
      isActive: true,
      role: user.role._id,
    });
    if (superAdminCount <= 1) {
      throw new ApiError('Cannot deactivate the last super admin', 400);
    }
  }

  user.isActive = isActive;
  if (!isActive) user.refreshToken = undefined;
  await user.save();

  return User.findById(user._id)
    .populate('role', 'name')
    .populate('branch', 'name')
    .lean();
};

const resetPassword = async (id, newPassword) => {
  const user = await User.findOne({ _id: id, isDeleted: false });
  if (!user) throw new ApiError('User not found', 404);

  user.password = newPassword;
  user.refreshToken = undefined;
  await user.save();

  return { message: 'Password reset successfully' };
};

const remove = async (id) => {
  const user = await User.findOne({ _id: id, isDeleted: false }).populate('role');
  if (!user) throw new ApiError('User not found', 404);

  if (user.role?.name === ROLES.SUPER_ADMIN) {
    const superAdminCount = await User.countDocuments({
      isDeleted: false,
      role: user.role._id,
    });
    if (superAdminCount <= 1) {
      throw new ApiError('Cannot delete the last super admin', 400);
    }
  }

  user.isDeleted = true;
  user.refreshToken = undefined;
  await user.save();

  return user;
};

module.exports = { getAll, getById, create, update, toggleStatus, resetPassword, remove };

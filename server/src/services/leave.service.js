const mongoose = require('mongoose');
const LeaveType = require('../models/LeaveType');
const LeaveApplication = require('../models/LeaveApplication');
const Holiday = require('../models/Holiday');
const ApiError = require('../utils/apiError');
const { paginate } = require('../utils/pagination');
const { notify } = require('../utils/notify');

// ─── Leave Types ──────────────────────────────────────────────

const getAllLeaveTypes = async () => {
  return LeaveType.find({ isDeleted: false }).sort({ name: 1 }).lean();
};

const createLeaveType = async (data) => {
  return LeaveType.create(data);
};

const updateLeaveType = async (id, data) => {
  const leaveType = await LeaveType.findOneAndUpdate(
    { _id: id, isDeleted: false },
    data,
    { new: true, runValidators: true }
  );
  if (!leaveType) throw new ApiError('Leave type not found', 404);
  return leaveType;
};

const deleteLeaveType = async (id) => {
  const leaveType = await LeaveType.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { isDeleted: true },
    { new: true }
  );
  if (!leaveType) throw new ApiError('Leave type not found', 404);
  return leaveType;
};

// ─── Leave Applications ──────────────────────────────────────

const getAllApplications = async (query = {}) => {
  const { page, limit, status, staff, search } = query;

  const filter = {};
  if (status) filter.status = status;
  if (staff) filter.staff = staff;

  // If search is provided, find matching staff IDs first
  if (search) {
    const Staff = require('../models/Staff');
    const User = require('../models/User');
    const regex = new RegExp(search, 'i');
    const users = await User.find({ name: regex }).select('_id').lean();
    const userIds = users.map((u) => u._id);
    const staffDocs = await Staff.find({
      $or: [
        { user: { $in: userIds } },
        { employeeId: regex },
      ],
    }).select('_id').lean();
    filter.staff = { $in: staffDocs.map((s) => s._id) };
  }

  return paginate(LeaveApplication, filter, {
    page,
    limit,
    populate: [
      { path: 'staff', populate: { path: 'user', select: 'name email' } },
      { path: 'leaveType', select: 'name daysAllowed' },
      { path: 'approvedBy', select: 'name' },
    ],
  });
};

const createApplication = async (data) => {
  // Validate balance
  const leaveType = await LeaveType.findById(data.leaveType);
  if (!leaveType) throw new ApiError('Leave type not found', 404);

  // Count already approved + pending leaves of this type for the current year
  const currentYear = new Date().getFullYear();
  const startOfYear = new Date(currentYear, 0, 1);
  const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59, 999);

  const staffObjectId = new mongoose.Types.ObjectId(data.staff);
  const usedDays = await LeaveApplication.aggregate([
    {
      $match: {
        staff: staffObjectId,
        leaveType: leaveType._id,
        status: { $in: ['approved', 'pending'] },
        startDate: { $gte: startOfYear, $lte: endOfYear },
      },
    },
    { $group: { _id: null, total: { $sum: '$totalDays' } } },
  ]);

  const totalUsed = usedDays.length > 0 ? usedDays[0].total : 0;
  const remaining = leaveType.daysAllowed - totalUsed;

  if (data.totalDays > remaining) {
    throw new ApiError(
      `Insufficient leave balance. Available: ${remaining} days, Requested: ${data.totalDays} days`,
      400
    );
  }

  const application = await LeaveApplication.create(data);
  return application.populate([
    { path: 'staff', populate: { path: 'user', select: 'name email' } },
    { path: 'leaveType', select: 'name daysAllowed' },
  ]);
};

const approveApplication = async (id, userId) => {
  const application = await LeaveApplication.findById(id);
  if (!application) throw new ApiError('Leave application not found', 404);
  if (application.status !== 'pending') {
    throw new ApiError('Application is not in pending status', 400);
  }

  application.status = 'approved';
  application.approvedBy = userId;
  application.approvedDate = new Date();
  await application.save();

  // Notify the applicant
  const staff = await mongoose.model('Staff').findById(application.staff);
  if (staff?.user) {
    notify({
      user: staff.user,
      title: 'Leave Approved',
      message: `Your leave application (${application.totalDays} days) has been approved`,
      type: 'success',
      module: 'leave',
      link: '/leave/apply',
    }).catch(() => {});
  }

  return application;
};

const rejectApplication = async (id, userId, reason) => {
  const application = await LeaveApplication.findById(id);
  if (!application) throw new ApiError('Leave application not found', 404);
  if (application.status !== 'pending') {
    throw new ApiError('Application is not in pending status', 400);
  }

  application.status = 'rejected';
  application.approvedBy = userId;
  application.approvedDate = new Date();
  application.rejectionReason = reason || '';
  await application.save();

  // Notify the applicant
  const staff = await mongoose.model('Staff').findById(application.staff);
  if (staff?.user) {
    notify({
      user: staff.user,
      title: 'Leave Rejected',
      message: `Your leave application has been rejected${reason ? `: ${reason}` : ''}`,
      type: 'error',
      module: 'leave',
      link: '/leave/apply',
    }).catch(() => {});
  }

  return application;
};

const getLeaveBalance = async (staffId) => {
  const leaveTypes = await LeaveType.find({ isDeleted: false, isActive: true }).lean();
  const staffObjectId = new mongoose.Types.ObjectId(staffId);

  const currentYear = new Date().getFullYear();
  const startOfYear = new Date(currentYear, 0, 1);
  const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59, 999);

  const balances = [];
  for (const lt of leaveTypes) {
    const usedDays = await LeaveApplication.aggregate([
      {
        $match: {
          staff: staffObjectId,
          leaveType: lt._id,
          status: 'approved',
          startDate: { $gte: startOfYear, $lte: endOfYear },
        },
      },
      { $group: { _id: null, total: { $sum: '$totalDays' } } },
    ]);

    const used = usedDays.length > 0 ? usedDays[0].total : 0;

    balances.push({
      leaveType: lt,
      allowed: lt.daysAllowed,
      used,
      remaining: lt.daysAllowed - used,
    });
  }

  return balances;
};

// ─── Holidays ─────────────────────────────────────────────────

const getAllHolidays = async () => {
  return Holiday.find().sort({ date: 1 }).lean();
};

const createHoliday = async (data) => {
  return Holiday.create(data);
};

const deleteHoliday = async (id) => {
  const holiday = await Holiday.findByIdAndDelete(id);
  if (!holiday) throw new ApiError('Holiday not found', 404);
  return holiday;
};

module.exports = {
  getAllLeaveTypes,
  createLeaveType,
  updateLeaveType,
  deleteLeaveType,
  getAllApplications,
  createApplication,
  approveApplication,
  rejectApplication,
  getLeaveBalance,
  getAllHolidays,
  createHoliday,
  deleteHoliday,
};

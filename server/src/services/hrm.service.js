const Staff = require('../models/Staff');
const User = require('../models/User');
const Role = require('../models/Role');
const Attendance = require('../models/Attendance');
const Payroll = require('../models/Payroll');
const Loan = require('../models/Loan');
const ApiError = require('../utils/apiError');
const { paginate } = require('../utils/pagination');
const { ROLES } = require('../config/constants');

// ─── Staff ────────────────────────────────────────────────────

const getAllStaff = async (query = {}) => {
  const { page, limit, search } = query;

  const filter = { isDeleted: false };

  if (search) {
    const regex = new RegExp(search, 'i');
    filter.$or = [
      { employeeId: regex },
      { department: regex },
      { designation: regex },
    ];
  }

  return paginate(Staff, filter, {
    page,
    limit,
    populate: { path: 'user', select: 'name email phone' },
  });
};

const getStaffById = async (id) => {
  const staff = await Staff.findOne({ _id: id, isDeleted: false })
    .populate('user', 'name email phone')
    .lean();
  if (!staff) {
    throw new ApiError('Staff not found', 404);
  }
  return staff;
};

const createStaff = async (data) => {
  const { name, email, password, phone, role: roleId, ...staffData } = data;

  // Validate required user fields
  if (!name || !email || !password) {
    throw new ApiError('Name, email, and password are required', 400);
  }

  // Check if email already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError('Email already registered', 400);
  }

  // Resolve role
  let role = roleId;
  if (!role) {
    const defaultRole = await Role.findOne({ name: ROLES.STAFF });
    if (!defaultRole) throw new ApiError('Default role not found. Please seed roles first.', 500);
    role = defaultRole._id;
  }

  // Create user account
  const user = await User.create({
    name,
    email,
    password,
    phone,
    role,
    branch: staffData.branch || undefined,
  });

  // Create staff record linked to the user
  const staff = await Staff.create({
    ...staffData,
    user: user._id,
  });

  return staff.populate('user', 'name email phone');
};

const updateStaff = async (id, data) => {
  const staff = await Staff.findOneAndUpdate(
    { _id: id, isDeleted: false },
    data,
    { new: true, runValidators: true }
  ).populate('user', 'name email phone');
  if (!staff) {
    throw new ApiError('Staff not found', 404);
  }
  return staff;
};

const removeStaff = async (id) => {
  const staff = await Staff.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { isDeleted: true },
    { new: true }
  );
  if (!staff) {
    throw new ApiError('Staff not found', 404);
  }
  return staff;
};

// ─── Attendance ───────────────────────────────────────────────

const getAttendanceByDate = async (date) => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const attendance = await Attendance.find({
    date: { $gte: startOfDay, $lte: endOfDay },
  })
    .populate({
      path: 'staff',
      populate: { path: 'user', select: 'name email' },
    })
    .lean();

  return attendance;
};

const markAttendance = async (data) => {
  // data is an array: [{ staff, date, status, checkIn, checkOut, note }]
  const records = Array.isArray(data) ? data : [data];
  const results = [];

  for (const record of records) {
    const dateObj = new Date(record.date);
    dateObj.setHours(0, 0, 0, 0);

    const existing = await Attendance.findOne({
      staff: record.staff,
      date: dateObj,
    });

    if (existing) {
      existing.status = record.status;
      existing.checkIn = record.checkIn || existing.checkIn;
      existing.checkOut = record.checkOut || existing.checkOut;
      existing.note = record.note || existing.note;
      await existing.save();
      results.push(existing);
    } else {
      const att = await Attendance.create({ ...record, date: dateObj });
      results.push(att);
    }
  }

  return results;
};

const getStaffAttendance = async (staffId, month, year) => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  const attendance = await Attendance.find({
    staff: staffId,
    date: { $gte: startDate, $lte: endDate },
  })
    .sort({ date: 1 })
    .lean();

  return attendance;
};

// ─── Payroll ──────────────────────────────────────────────────

const generatePayroll = async (month, year) => {
  // Check if payroll already exists for this month/year
  const existing = await Payroll.find({ month, year });
  if (existing.length > 0) {
    throw new ApiError('Payroll already generated for this month/year', 400);
  }

  const staffList = await Staff.find({ isDeleted: false, isActive: true });

  const payrolls = [];
  for (const staff of staffList) {
    // Calculate loan deduction
    const activeLoans = await Loan.find({ staff: staff._id, status: 'active' });
    const loanDeduction = activeLoans.reduce((sum, loan) => sum + loan.monthlyDeduction, 0);

    // Count absent days for deductions
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const absentDays = await Attendance.countDocuments({
      staff: staff._id,
      date: { $gte: startDate, $lte: endDate },
      status: 'absent',
    });

    const halfDays = await Attendance.countDocuments({
      staff: staff._id,
      date: { $gte: startDate, $lte: endDate },
      status: 'half_day',
    });

    // Calculate per-day salary
    const totalDaysInMonth = new Date(year, month, 0).getDate();
    const perDaySalary = staff.basicSalary / totalDaysInMonth;

    const absentDeduction = (absentDays * perDaySalary) + (halfDays * perDaySalary * 0.5);

    const netSalary =
      staff.basicSalary +
      staff.allowances -
      staff.deductions -
      loanDeduction -
      absentDeduction;

    const payroll = await Payroll.create({
      staff: staff._id,
      month,
      year,
      basicSalary: staff.basicSalary,
      allowances: staff.allowances,
      deductions: staff.deductions + absentDeduction,
      loanDeduction,
      netSalary: Math.max(0, netSalary),
    });

    payrolls.push(payroll);
  }

  return payrolls;
};

const getAllPayroll = async (query = {}) => {
  const { page, limit, month, year } = query;

  const filter = {};
  if (month) filter.month = parseInt(month);
  if (year) filter.year = parseInt(year);

  return paginate(Payroll, filter, {
    page,
    limit,
    populate: { path: 'staff', populate: { path: 'user', select: 'name email' } },
  });
};

const approvePayroll = async (id) => {
  const payroll = await Payroll.findById(id);
  if (!payroll) throw new ApiError('Payroll not found', 404);
  if (payroll.status !== 'draft') throw new ApiError('Payroll is not in draft status', 400);

  payroll.status = 'approved';
  await payroll.save();
  return payroll;
};

const markPayrollPaid = async (id, userId) => {
  const payroll = await Payroll.findById(id);
  if (!payroll) throw new ApiError('Payroll not found', 404);
  if (payroll.status !== 'approved') throw new ApiError('Payroll must be approved first', 400);

  payroll.status = 'paid';
  payroll.paidDate = new Date();
  payroll.paidBy = userId;
  await payroll.save();

  // Update loan balances
  const activeLoans = await Loan.find({ staff: payroll.staff, status: 'active' });
  for (const loan of activeLoans) {
    loan.totalPaid += loan.monthlyDeduction;
    loan.remainingBalance = loan.amount - loan.totalPaid;
    if (loan.remainingBalance <= 0) {
      loan.remainingBalance = 0;
      loan.status = 'completed';
    }
    await loan.save();
  }

  return payroll;
};

// ─── Loan ─────────────────────────────────────────────────────

const getAllLoans = async (query = {}) => {
  const { page, limit, status } = query;
  const filter = {};
  if (status) filter.status = status;

  return paginate(Loan, filter, {
    page,
    limit,
    populate: { path: 'staff', populate: { path: 'user', select: 'name email' } },
  });
};

const createLoan = async (data) => {
  const loan = await Loan.create(data);
  return loan.populate({ path: 'staff', populate: { path: 'user', select: 'name email' } });
};

const getLoansByStaff = async (staffId) => {
  const loans = await Loan.find({ staff: staffId })
    .populate({ path: 'staff', populate: { path: 'user', select: 'name email' } })
    .sort({ createdAt: -1 })
    .lean();
  return loans;
};

module.exports = {
  getAllStaff,
  getStaffById,
  createStaff,
  updateStaff,
  removeStaff,
  getAttendanceByDate,
  markAttendance,
  getStaffAttendance,
  generatePayroll,
  getAllPayroll,
  approvePayroll,
  markPayrollPaid,
  getAllLoans,
  createLoan,
  getLoansByStaff,
};

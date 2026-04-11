const asyncHandler = require('../utils/asyncHandler');
const hrmService = require('../services/hrm.service');

// ─── Staff ────────────────────────────────────────────────────

const getStaff = asyncHandler(async (req, res) => {
  const result = await hrmService.getAllStaff(req.query);
  res.json({ success: true, data: result, message: 'Staff retrieved' });
});

const getStaffById = asyncHandler(async (req, res) => {
  const staff = await hrmService.getStaffById(req.params.id);
  res.json({ success: true, data: staff, message: 'Staff retrieved' });
});

const createStaff = asyncHandler(async (req, res) => {
  const staff = await hrmService.createStaff(req.body);
  res.status(201).json({ success: true, data: staff, message: 'Staff created' });
});

const updateStaff = asyncHandler(async (req, res) => {
  const staff = await hrmService.updateStaff(req.params.id, req.body);
  res.json({ success: true, data: staff, message: 'Staff updated' });
});

const deleteStaff = asyncHandler(async (req, res) => {
  await hrmService.removeStaff(req.params.id);
  res.json({ success: true, data: null, message: 'Staff deleted' });
});

// ─── Attendance ───────────────────────────────────────────────

const getAttendance = asyncHandler(async (req, res) => {
  const { date } = req.query;
  const result = await hrmService.getAttendanceByDate(date || new Date());
  res.json({ success: true, data: result, message: 'Attendance retrieved' });
});

const markAttendance = asyncHandler(async (req, res) => {
  const result = await hrmService.markAttendance(req.body);
  res.status(201).json({ success: true, data: result, message: 'Attendance marked' });
});

const getStaffAttendance = asyncHandler(async (req, res) => {
  const { month, year } = req.query;
  const result = await hrmService.getStaffAttendance(
    req.params.staffId,
    parseInt(month) || new Date().getMonth() + 1,
    parseInt(year) || new Date().getFullYear()
  );
  res.json({ success: true, data: result, message: 'Staff attendance retrieved' });
});

// ─── Payroll ──────────────────────────────────────────────────

const getPayroll = asyncHandler(async (req, res) => {
  const result = await hrmService.getAllPayroll(req.query);
  res.json({ success: true, data: result, message: 'Payroll retrieved' });
});

const generatePayroll = asyncHandler(async (req, res) => {
  const { month, year } = req.body;
  const result = await hrmService.generatePayroll(
    parseInt(month),
    parseInt(year)
  );
  res.status(201).json({ success: true, data: result, message: 'Payroll generated' });
});

const approvePayroll = asyncHandler(async (req, res) => {
  const result = await hrmService.approvePayroll(req.params.id);
  res.json({ success: true, data: result, message: 'Payroll approved' });
});

const markPayrollPaid = asyncHandler(async (req, res) => {
  const result = await hrmService.markPayrollPaid(req.params.id, req.user._id);
  res.json({ success: true, data: result, message: 'Payroll marked as paid' });
});

// ─── Loan ─────────────────────────────────────────────────────

const getLoans = asyncHandler(async (req, res) => {
  const result = await hrmService.getAllLoans(req.query);
  res.json({ success: true, data: result, message: 'Loans retrieved' });
});

const createLoan = asyncHandler(async (req, res) => {
  const loan = await hrmService.createLoan(req.body);
  res.status(201).json({ success: true, data: loan, message: 'Loan created' });
});

const getLoansByStaff = asyncHandler(async (req, res) => {
  const loans = await hrmService.getLoansByStaff(req.params.staffId);
  res.json({ success: true, data: loans, message: 'Staff loans retrieved' });
});

module.exports = {
  getStaff,
  getStaffById,
  createStaff,
  updateStaff,
  deleteStaff,
  getAttendance,
  markAttendance,
  getStaffAttendance,
  getPayroll,
  generatePayroll,
  approvePayroll,
  markPayrollPaid,
  getLoans,
  createLoan,
  getLoansByStaff,
};

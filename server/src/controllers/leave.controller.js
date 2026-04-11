const asyncHandler = require('../utils/asyncHandler');
const leaveService = require('../services/leave.service');

// ─── Leave Types ──────────────────────────────────────────────

const getLeaveTypes = asyncHandler(async (req, res) => {
  const result = await leaveService.getAllLeaveTypes();
  res.json({ success: true, data: result, message: 'Leave types retrieved' });
});

const createLeaveType = asyncHandler(async (req, res) => {
  const leaveType = await leaveService.createLeaveType(req.body);
  res.status(201).json({ success: true, data: leaveType, message: 'Leave type created' });
});

const updateLeaveType = asyncHandler(async (req, res) => {
  const leaveType = await leaveService.updateLeaveType(req.params.id, req.body);
  res.json({ success: true, data: leaveType, message: 'Leave type updated' });
});

const deleteLeaveType = asyncHandler(async (req, res) => {
  await leaveService.deleteLeaveType(req.params.id);
  res.json({ success: true, data: null, message: 'Leave type deleted' });
});

// ─── Leave Applications ──────────────────────────────────────

const getApplications = asyncHandler(async (req, res) => {
  const result = await leaveService.getAllApplications(req.query);
  res.json({ success: true, data: result, message: 'Leave applications retrieved' });
});

const createApplication = asyncHandler(async (req, res) => {
  const application = await leaveService.createApplication(req.body);
  res.status(201).json({ success: true, data: application, message: 'Leave application created' });
});

const approveApplication = asyncHandler(async (req, res) => {
  const application = await leaveService.approveApplication(req.params.id, req.user._id);
  res.json({ success: true, data: application, message: 'Leave application approved' });
});

const rejectApplication = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const application = await leaveService.rejectApplication(req.params.id, req.user._id, reason);
  res.json({ success: true, data: application, message: 'Leave application rejected' });
});

const getLeaveBalance = asyncHandler(async (req, res) => {
  const balance = await leaveService.getLeaveBalance(req.params.staffId);
  res.json({ success: true, data: balance, message: 'Leave balance retrieved' });
});

// ─── Holidays ─────────────────────────────────────────────────

const getHolidays = asyncHandler(async (req, res) => {
  const result = await leaveService.getAllHolidays();
  res.json({ success: true, data: result, message: 'Holidays retrieved' });
});

const createHoliday = asyncHandler(async (req, res) => {
  const holiday = await leaveService.createHoliday(req.body);
  res.status(201).json({ success: true, data: holiday, message: 'Holiday created' });
});

const deleteHoliday = asyncHandler(async (req, res) => {
  await leaveService.deleteHoliday(req.params.id);
  res.json({ success: true, data: null, message: 'Holiday deleted' });
});

module.exports = {
  getLeaveTypes,
  createLeaveType,
  updateLeaveType,
  deleteLeaveType,
  getApplications,
  createApplication,
  approveApplication,
  rejectApplication,
  getLeaveBalance,
  getHolidays,
  createHoliday,
  deleteHoliday,
};

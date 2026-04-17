const asyncHandler = require('../utils/asyncHandler');
const approvalService = require('../services/approval.service');

// ── Rules ──

const getRules = asyncHandler(async (req, res) => {
  const result = await approvalService.getRules(req.query);
  res.json({ success: true, data: result, message: 'Approval rules retrieved' });
});

const getRule = asyncHandler(async (req, res) => {
  const rule = await approvalService.getRuleById(req.params.id);
  res.json({ success: true, data: rule, message: 'Approval rule retrieved' });
});

const createRule = asyncHandler(async (req, res) => {
  const rule = await approvalService.createRule(req.body, req.user._id);
  res.status(201).json({ success: true, data: rule, message: 'Approval rule created' });
});

const updateRule = asyncHandler(async (req, res) => {
  const rule = await approvalService.updateRule(req.params.id, req.body);
  res.json({ success: true, data: rule, message: 'Approval rule updated' });
});

const deleteRule = asyncHandler(async (req, res) => {
  await approvalService.deleteRule(req.params.id);
  res.json({ success: true, data: null, message: 'Approval rule deleted' });
});

// ── Requests ──

const submitApproval = asyncHandler(async (req, res) => {
  const result = await approvalService.submit(req.body, req.user._id);
  res.status(201).json({ success: true, data: result, message: 'Approval submitted' });
});

const getApprovals = asyncHandler(async (req, res) => {
  const result = await approvalService.getAll(req.query);
  res.json({ success: true, data: result, message: 'Approvals retrieved' });
});

const getPendingApprovals = asyncHandler(async (req, res) => {
  const result = await approvalService.getPending(req.user._id, req.query);
  res.json({ success: true, data: result, message: 'Pending approvals retrieved' });
});

const getApproval = asyncHandler(async (req, res) => {
  const request = await approvalService.getById(req.params.id);
  res.json({ success: true, data: request, message: 'Approval retrieved' });
});

const getMySubmissions = asyncHandler(async (req, res) => {
  const result = await approvalService.getMySubmissions(req.user._id, req.query);
  res.json({ success: true, data: result, message: 'Submissions retrieved' });
});

const approveRequest = asyncHandler(async (req, res) => {
  const result = await approvalService.approve(req.params.id, req.user._id, req.body.comment);
  res.json({ success: true, data: result, message: 'Approved successfully' });
});

const rejectRequest = asyncHandler(async (req, res) => {
  const result = await approvalService.reject(req.params.id, req.user._id, req.body.comment);
  res.json({ success: true, data: result, message: 'Rejected' });
});

const holdRequest = asyncHandler(async (req, res) => {
  const result = await approvalService.hold(req.params.id, req.user._id, req.body.comment);
  res.json({ success: true, data: result, message: 'Put on hold' });
});

const cancelRequest = asyncHandler(async (req, res) => {
  const result = await approvalService.cancel(req.params.id, req.user._id);
  res.json({ success: true, data: result, message: 'Cancelled' });
});

const escalateRequest = asyncHandler(async (req, res) => {
  const result = await approvalService.escalate(req.params.id, req.user._id, req.body.comment);
  res.json({ success: true, data: result, message: 'Escalated' });
});

module.exports = {
  getRules, getRule, createRule, updateRule, deleteRule,
  submitApproval, getApprovals, getPendingApprovals, getApproval, getMySubmissions,
  approveRequest, rejectRequest, holdRequest, cancelRequest, escalateRequest,
};

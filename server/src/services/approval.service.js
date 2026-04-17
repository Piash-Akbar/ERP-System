const ApprovalRule = require('../models/ApprovalRule');
const ApprovalRequest = require('../models/ApprovalRequest');
const User = require('../models/User');
const ApiError = require('../utils/apiError');
const { paginate } = require('../utils/pagination');

// ── Rule CRUD ──

const getRules = async (query = {}) => {
  const { page, limit, search, module: mod, isActive } = query;
  const filter = { isDeleted: false };

  if (mod) filter.module = mod;
  if (isActive !== undefined && isActive !== '') filter.isActive = isActive === 'true';
  if (search) filter.name = { $regex: search, $options: 'i' };

  return paginate(ApprovalRule, filter, {
    page,
    limit,
    populate: [
      { path: 'levels.approverRoles', select: 'name' },
      { path: 'createdBy', select: 'name' },
    ],
    sort: { priority: -1, createdAt: -1 },
  });
};

const getRuleById = async (id) => {
  const rule = await ApprovalRule.findOne({ _id: id, isDeleted: false })
    .populate('levels.approverRoles', 'name')
    .populate('levels.approverUsers', 'name email')
    .populate('createdBy', 'name')
    .lean();
  if (!rule) throw new ApiError('Approval rule not found', 404);
  return rule;
};

const createRule = async (data, userId) => {
  data.createdBy = userId;
  const rule = await ApprovalRule.create(data);
  return rule;
};

const updateRule = async (id, data) => {
  const rule = await ApprovalRule.findOneAndUpdate(
    { _id: id, isDeleted: false },
    data,
    { new: true, runValidators: true }
  );
  if (!rule) throw new ApiError('Approval rule not found', 404);
  return rule;
};

const deleteRule = async (id) => {
  const rule = await ApprovalRule.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { isDeleted: true },
    { new: true }
  );
  if (!rule) throw new ApiError('Approval rule not found', 404);
  return rule;
};

// ── Rule Matching ──

const findMatchingRule = async (module, action, documentData = {}, branch = null) => {
  const filter = { module, action, isActive: true, isDeleted: false };
  if (branch) {
    filter.$or = [{ branch }, { branch: null }, { branch: { $exists: false } }];
  }

  const rules = await ApprovalRule.find(filter).sort({ priority: -1 }).lean();

  for (const rule of rules) {
    if (!rule.conditions || rule.conditions.length === 0) return rule;

    const allConditionsMet = rule.conditions.every((cond) => {
      const fieldValue = documentData[cond.field];
      if (fieldValue === undefined || fieldValue === null) return false;
      switch (cond.operator) {
        case 'gt': return fieldValue > cond.value;
        case 'gte': return fieldValue >= cond.value;
        case 'lt': return fieldValue < cond.value;
        case 'lte': return fieldValue <= cond.value;
        case 'eq': return fieldValue === cond.value;
        case 'ne': return fieldValue !== cond.value;
        default: return false;
      }
    });

    if (allConditionsMet) return rule;
  }

  return null;
};

// ── Approval Requests ──

const submit = async (data, userId) => {
  const rule = await findMatchingRule(data.module, data.action, data.metadata, data.branch);

  if (!rule) {
    return { requiresApproval: false };
  }

  const escalateHours = rule.levels[0]?.escalateAfterHours || 48;
  const dueDate = new Date(Date.now() + escalateHours * 60 * 60 * 1000);

  const request = await ApprovalRequest.create({
    rule: rule._id,
    module: data.module,
    action: data.action,
    sourceModel: data.sourceModel,
    sourceId: data.sourceId,
    sourceRef: data.sourceRef || '',
    submittedBy: userId,
    branch: data.branch || undefined,
    currentLevel: 1,
    totalLevels: rule.levels.length,
    metadata: data.metadata || {},
    dueDate,
  });

  return { requiresApproval: true, approvalId: request._id, request };
};

const getAll = async (query = {}) => {
  const { page, limit, search, status, module: mod } = query;
  const filter = { isDeleted: false };

  if (status) filter.status = status;
  if (mod) filter.module = mod;
  if (search) {
    filter.$or = [
      { sourceRef: { $regex: search, $options: 'i' } },
      { module: { $regex: search, $options: 'i' } },
    ];
  }

  return paginate(ApprovalRequest, filter, {
    page,
    limit,
    populate: [
      { path: 'submittedBy', select: 'name email' },
      { path: 'rule', select: 'name' },
    ],
    sort: { createdAt: -1 },
  });
};

const getPending = async (userId, query = {}) => {
  const { page, limit } = query;

  const user = await User.findById(userId).populate('role').lean();
  if (!user) throw new ApiError('User not found', 404);

  // Find requests where the user's role or user ID is in the current level's approvers
  const pendingRequests = await ApprovalRequest.find({
    status: { $in: ['pending', 'escalated'] },
    isDeleted: false,
  })
    .populate('rule')
    .populate('submittedBy', 'name email')
    .sort({ createdAt: -1 })
    .lean();

  // Filter to those the current user can approve at current level
  const filtered = pendingRequests.filter((req) => {
    if (!req.rule) return false;
    const currentLevelConfig = req.rule.levels.find((l) => l.level === req.currentLevel);
    if (!currentLevelConfig) return false;

    const roleMatch = currentLevelConfig.approverRoles.some(
      (r) => r.toString() === (user.role?._id || user.role)?.toString()
    );
    const userMatch = currentLevelConfig.approverUsers?.some(
      (u) => u.toString() === userId.toString()
    );

    return roleMatch || userMatch;
  });

  const startIdx = ((parseInt(page) || 1) - 1) * (parseInt(limit) || 20);
  const endIdx = startIdx + (parseInt(limit) || 20);

  return {
    data: filtered.slice(startIdx, endIdx),
    pagination: {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      total: filtered.length,
      totalPages: Math.ceil(filtered.length / (parseInt(limit) || 20)),
    },
  };
};

const getById = async (id) => {
  const request = await ApprovalRequest.findOne({ _id: id, isDeleted: false })
    .populate('rule')
    .populate('submittedBy', 'name email')
    .populate('approvals.user', 'name email')
    .populate('branch', 'name')
    .lean();
  if (!request) throw new ApiError('Approval request not found', 404);
  return request;
};

const getMySubmissions = async (userId, query = {}) => {
  const { page, limit, status } = query;
  const filter = { submittedBy: userId, isDeleted: false };
  if (status) filter.status = status;

  return paginate(ApprovalRequest, filter, {
    page,
    limit,
    populate: [
      { path: 'rule', select: 'name' },
    ],
    sort: { createdAt: -1 },
  });
};

const approve = async (id, userId, comment) => {
  const request = await ApprovalRequest.findOne({ _id: id, status: { $in: ['pending', 'escalated'] }, isDeleted: false });
  if (!request) throw new ApiError('Approval request not found or already resolved', 404);

  request.approvals.push({
    level: request.currentLevel,
    user: userId,
    action: 'approved',
    comment: comment || '',
  });

  // Check if current level is fully approved
  const rule = await ApprovalRule.findById(request.rule).lean();
  const currentLevelConfig = rule?.levels.find((l) => l.level === request.currentLevel);
  const approvalsAtLevel = request.approvals.filter(
    (a) => a.level === request.currentLevel && a.action === 'approved'
  );

  if (approvalsAtLevel.length >= (currentLevelConfig?.requiredCount || 1)) {
    if (request.currentLevel >= request.totalLevels) {
      request.status = 'approved';
    } else {
      request.currentLevel += 1;
      const nextLevel = rule?.levels.find((l) => l.level === request.currentLevel);
      const escalateHours = nextLevel?.escalateAfterHours || 48;
      request.dueDate = new Date(Date.now() + escalateHours * 60 * 60 * 1000);
    }
  }

  await request.save();
  return request;
};

const reject = async (id, userId, comment) => {
  const request = await ApprovalRequest.findOne({ _id: id, status: { $in: ['pending', 'escalated'] }, isDeleted: false });
  if (!request) throw new ApiError('Approval request not found or already resolved', 404);

  request.approvals.push({
    level: request.currentLevel,
    user: userId,
    action: 'rejected',
    comment: comment || '',
  });
  request.status = 'rejected';
  await request.save();

  return request;
};

const hold = async (id, userId, comment) => {
  const request = await ApprovalRequest.findOne({ _id: id, status: { $in: ['pending', 'escalated'] }, isDeleted: false });
  if (!request) throw new ApiError('Approval request not found or already resolved', 404);

  request.approvals.push({
    level: request.currentLevel,
    user: userId,
    action: 'hold',
    comment: comment || '',
  });
  request.status = 'on_hold';
  await request.save();

  return request;
};

const cancel = async (id, userId) => {
  const request = await ApprovalRequest.findOne({
    _id: id,
    submittedBy: userId,
    status: { $in: ['pending', 'on_hold'] },
    isDeleted: false,
  });
  if (!request) throw new ApiError('Cannot cancel this request', 404);

  request.status = 'cancelled';
  await request.save();

  return request;
};

const escalate = async (id, userId, comment) => {
  const request = await ApprovalRequest.findOne({ _id: id, status: 'pending', isDeleted: false });
  if (!request) throw new ApiError('Approval request not found', 404);

  if (request.currentLevel >= request.totalLevels) {
    throw new ApiError('Already at the highest approval level', 400);
  }

  request.currentLevel += 1;
  request.status = 'escalated';

  const rule = await ApprovalRule.findById(request.rule).lean();
  const nextLevel = rule?.levels.find((l) => l.level === request.currentLevel);
  const escalateHours = nextLevel?.escalateAfterHours || 48;
  request.dueDate = new Date(Date.now() + escalateHours * 60 * 60 * 1000);

  request.approvals.push({
    level: request.currentLevel - 1,
    user: userId,
    action: 'change_request',
    comment: `Escalated: ${comment || 'No reason provided'}`,
  });

  await request.save();
  return request;
};

module.exports = {
  getRules,
  getRuleById,
  createRule,
  updateRule,
  deleteRule,
  findMatchingRule,
  submit,
  getAll,
  getPending,
  getById,
  getMySubmissions,
  approve,
  reject,
  hold,
  cancel,
  escalate,
};

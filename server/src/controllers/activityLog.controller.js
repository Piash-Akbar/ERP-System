const asyncHandler = require('../utils/asyncHandler');
const activityLogService = require('../services/activityLog.service');

exports.getActivityLogs = asyncHandler(async (req, res) => {
  const result = await activityLogService.getAll(req.query);
  res.json({ success: true, data: result, message: 'Activity logs retrieved' });
});

const asyncHandler = require('../utils/asyncHandler');
const dashboardService = require('../services/dashboard.service');

exports.getSummary = asyncHandler(async (req, res) => {
  const period = req.query.period || 'year';
  const data = await dashboardService.getSummary(period);
  res.json({ success: true, data, message: 'Dashboard summary retrieved' });
});

exports.getChartData = asyncHandler(async (req, res) => {
  const data = await dashboardService.getMonthlySalesExpense();
  res.json({ success: true, data, message: 'Chart data retrieved' });
});

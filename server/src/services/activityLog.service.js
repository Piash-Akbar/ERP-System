const ActivityLog = require('../models/ActivityLog');
const { paginate } = require('../utils/pagination');

const getAll = async (query) => {
  const filter = {};

  if (query.user) filter.user = query.user;
  if (query.module) filter.module = query.module;

  if (query.startDate || query.endDate) {
    filter.createdAt = {};
    if (query.startDate) filter.createdAt.$gte = new Date(query.startDate);
    if (query.endDate) filter.createdAt.$lte = new Date(query.endDate);
  }

  if (query.search) {
    filter.$or = [
      { action: { $regex: query.search, $options: 'i' } },
      { description: { $regex: query.search, $options: 'i' } },
      { module: { $regex: query.search, $options: 'i' } },
    ];
  }

  return paginate(ActivityLog, filter, {
    page: query.page,
    limit: query.limit,
    sort: { createdAt: -1 },
    populate: [
      { path: 'user', select: 'name email' },
    ],
  });
};

module.exports = { getAll };

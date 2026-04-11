const paginate = async (model, query = {}, options = {}) => {
  const page = parseInt(options.page) || 1;
  const limit = parseInt(options.limit) || 20;
  const skip = (page - 1) * limit;
  const sort = options.sort || { createdAt: -1 };
  const populate = options.populate || '';
  const select = options.select || '';

  const [data, total] = await Promise.all([
    model.find(query).sort(sort).skip(skip).limit(limit).populate(populate).select(select).lean(),
    model.countDocuments(query),
  ]);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

module.exports = { paginate };

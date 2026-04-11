const Setting = require('../models/Setting');

const getAll = async () => {
  return Setting.find().lean();
};

const getByGroup = async (group) => {
  return Setting.find({ group }).lean();
};

const getByKey = async (key) => {
  return Setting.findOne({ key }).lean();
};

const getByKeys = async (keys) => {
  return Setting.find({ key: { $in: keys } }).lean();
};

const upsert = async (key, value, group) => {
  return Setting.findOneAndUpdate(
    { key },
    { key, value, group },
    { upsert: true, new: true, runValidators: true }
  );
};

const bulkUpsert = async (settings) => {
  const results = [];
  for (const setting of settings) {
    const result = await upsert(setting.key, setting.value, setting.group);
    results.push(result);
  }
  return results;
};

module.exports = { getAll, getByGroup, getByKey, getByKeys, upsert, bulkUpsert };

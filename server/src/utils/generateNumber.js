/**
 * Generate a sequential reference number per prefix per day.
 * Pattern: PREFIX-YYYYMMDD-NNN (e.g., GRN-20260417-001)
 */
const generateNumber = async (prefix, Model, fieldName) => {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const pattern = `${prefix}-${dateStr}-`;

  const lastRecord = await Model.findOne({
    [fieldName]: { $regex: `^${pattern}` },
  })
    .sort({ [fieldName]: -1 })
    .select(fieldName)
    .lean();

  let nextNum = 1;
  if (lastRecord && lastRecord[fieldName]) {
    const lastNum = parseInt(lastRecord[fieldName].split('-').pop(), 10);
    if (!isNaN(lastNum)) {
      nextNum = lastNum + 1;
    }
  }

  return `${pattern}${String(nextNum).padStart(3, '0')}`;
};

module.exports = { generateNumber };

const Product = require('../models/Product');
const BarcodeLog = require('../models/BarcodeLog');
const ApiError = require('../utils/apiError');
const { paginate } = require('../utils/pagination');

const generateUniqueBarcode = async (prefix = 'ANX') => {
  let attempts = 0;
  while (attempts < 100) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const barcode = `${prefix}${timestamp}${random}`;

    const existsInProduct = await Product.findOne({ barcode, isDeleted: false });
    const existsInLog = await BarcodeLog.findOne({ barcode });

    if (!existsInProduct && !existsInLog) return barcode;
    attempts++;
  }
  throw new ApiError('Failed to generate unique barcode after 100 attempts', 500);
};

const generate = async (data, userId) => {
  const product = await Product.findOne({ _id: data.productId, isDeleted: false });
  if (!product) throw new ApiError('Product not found', 404);

  // Check if product or variant already has a barcode
  if (data.variantId) {
    const variant = product.variants.id(data.variantId);
    if (!variant) throw new ApiError('Variant not found', 404);
    if (variant.barcode) throw new ApiError('Variant already has a barcode', 400);
  } else if (product.barcode) {
    throw new ApiError('Product already has a barcode', 400);
  }

  const barcode = await generateUniqueBarcode(data.prefix || 'ANX');

  // Assign to product or variant
  if (data.variantId) {
    const variant = product.variants.id(data.variantId);
    variant.barcode = barcode;
    variant.barcodeType = data.barcodeType || 'CODE128';
  } else {
    product.barcode = barcode;
    product.barcodeType = data.barcodeType || 'CODE128';
  }
  await product.save();

  // Create log entry
  const log = await BarcodeLog.create({
    barcode,
    product: product._id,
    variantId: data.variantId || undefined,
    type: 'generated',
    barcodeType: data.barcodeType || 'CODE128',
    generatedBy: userId,
  });

  return { barcode, product: product._id, log };
};

const generateBulk = async (data, userId) => {
  const results = [];
  for (const productId of data.productIds) {
    try {
      const result = await generate(
        { productId, barcodeType: data.barcodeType, prefix: data.prefix },
        userId
      );
      results.push({ productId, barcode: result.barcode, success: true });
    } catch (err) {
      results.push({ productId, error: err.message, success: false });
    }
  }
  return results;
};

const lookup = async (code) => {
  // Search in products
  const product = await Product.findOne({
    $or: [
      { barcode: code, isDeleted: false },
      { 'variants.barcode': code, isDeleted: false },
    ],
  })
    .populate('category', 'name')
    .populate('brand', 'name')
    .populate('unit', 'name')
    .lean();

  if (product) {
    const matchedVariant = product.variants?.find((v) => v.barcode === code);
    return { found: true, product, variant: matchedVariant || null };
  }

  return { found: false };
};

const checkDuplicate = async (barcode) => {
  const productMatch = await Product.findOne({
    $or: [
      { barcode, isDeleted: false },
      { 'variants.barcode': barcode, isDeleted: false },
    ],
  }).lean();

  return {
    isDuplicate: !!productMatch,
    product: productMatch ? { _id: productMatch._id, name: productMatch.name, sku: productMatch.sku } : null,
  };
};

const assign = async (data, userId) => {
  // Check for duplicate
  const dup = await checkDuplicate(data.barcode);
  if (dup.isDuplicate) {
    throw new ApiError(`Barcode already assigned to ${dup.product.name} (${dup.product.sku})`, 400);
  }

  const product = await Product.findOne({ _id: data.productId, isDeleted: false });
  if (!product) throw new ApiError('Product not found', 404);

  if (data.variantId) {
    const variant = product.variants.id(data.variantId);
    if (!variant) throw new ApiError('Variant not found', 404);
    variant.barcode = data.barcode;
    variant.barcodeType = data.barcodeType || 'CODE128';
  } else {
    product.barcode = data.barcode;
    product.barcodeType = data.barcodeType || 'CODE128';
  }
  await product.save();

  await BarcodeLog.create({
    barcode: data.barcode,
    product: product._id,
    variantId: data.variantId || undefined,
    type: 'manual',
    barcodeType: data.barcodeType || 'CODE128',
    generatedBy: userId,
  });

  return product;
};

const getPrintData = async (productIds) => {
  const products = await Product.find({
    _id: { $in: productIds },
    isDeleted: false,
  })
    .select('name sku barcode barcodeType sellingPrice purchasePrice variants image')
    .lean();

  return products.map((p) => ({
    _id: p._id,
    name: p.name,
    sku: p.sku,
    barcode: p.barcode,
    barcodeType: p.barcodeType || 'CODE128',
    price: p.sellingPrice,
    image: p.image,
    variants: (p.variants || [])
      .filter((v) => v.barcode)
      .map((v) => ({
        _id: v._id,
        name: v.name,
        sku: v.sku,
        barcode: v.barcode,
        barcodeType: v.barcodeType || 'CODE128',
        price: v.sellingPrice,
      })),
  }));
};

const logPrint = async (barcodes) => {
  const now = new Date();
  await BarcodeLog.updateMany(
    { barcode: { $in: barcodes } },
    { $inc: { printCount: 1 }, $set: { lastPrintedAt: now } }
  );
  return { updated: barcodes.length };
};

const getUnassigned = async (query = {}) => {
  const { page, limit, search } = query;
  const filter = {
    isDeleted: false,
    $or: [{ barcode: null }, { barcode: '' }, { barcode: { $exists: false } }],
  };

  if (search) {
    filter.$and = [
      { $or: [{ name: { $regex: search, $options: 'i' } }, { sku: { $regex: search, $options: 'i' } }] },
    ];
  }

  return paginate(Product, filter, {
    page,
    limit,
    select: 'name sku category sellingPrice stock',
    populate: [{ path: 'category', select: 'name' }],
    sort: { createdAt: -1 },
  });
};

const getAll = async (query = {}) => {
  const { page, limit, search } = query;
  const filter = { isDeleted: false };
  if (search) {
    filter.$or = [{ barcode: { $regex: search, $options: 'i' } }];
  }
  return paginate(BarcodeLog, filter, {
    page,
    limit,
    populate: [
      { path: 'product', select: 'name sku' },
      { path: 'generatedBy', select: 'name' },
    ],
    sort: { createdAt: -1 },
  });
};

const getDashboardStats = async () => {
  const [totalProducts, withBarcode, withoutBarcode, totalGenerated] = await Promise.all([
    Product.countDocuments({ isDeleted: false }),
    Product.countDocuments({ isDeleted: false, barcode: { $ne: null, $ne: '' } }),
    Product.countDocuments({
      isDeleted: false,
      $or: [{ barcode: null }, { barcode: '' }, { barcode: { $exists: false } }],
    }),
    BarcodeLog.countDocuments({ isDeleted: false }),
  ]);

  return { totalProducts, withBarcode, withoutBarcode, totalGenerated };
};

module.exports = {
  generate, generateBulk, lookup, checkDuplicate, assign,
  getPrintData, logPrint, getUnassigned, getAll, getDashboardStats,
};

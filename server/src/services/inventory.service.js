const Product = require('../models/Product');
const StockAdjustment = require('../models/StockAdjustment');
const StockTransfer = require('../models/StockTransfer');
const ApiError = require('../utils/apiError');
const { paginate } = require('../utils/pagination');

const productPopulate = [
  { path: 'category', select: 'name slug' },
  { path: 'brand', select: 'name' },
  { path: 'unit', select: 'name shortName' },
  { path: 'warehouse', select: 'name' },
];

const getStockList = async (query) => {
  const filter = { isDeleted: false };

  if (query.search) {
    const regex = new RegExp(query.search, 'i');
    filter.$or = [{ name: regex }, { sku: regex }];
  }

  if (query.category) filter.category = query.category;
  if (query.warehouse) filter.warehouse = query.warehouse;

  const result = await paginate(Product, filter, {
    page: query.page,
    limit: query.limit,
    sort: query.sort || { createdAt: -1 },
    populate: productPopulate,
  });

  return result;
};

const getLowStock = async () => {
  const products = await Product.find({
    isDeleted: false,
    $expr: { $lte: ['$stock', '$alertQuantity'] },
  })
    .populate(productPopulate)
    .lean();

  return products;
};

const adjustStock = async (data, userId) => {
  const product = await Product.findOne({ _id: data.product, isDeleted: false });
  if (!product) {
    throw new ApiError('Product not found', 404);
  }

  if (data.variantId) {
    const variant = product.variants.id(data.variantId);
    if (!variant) {
      throw new ApiError('Variant not found', 404);
    }

    if (data.type === 'subtraction' && variant.stock < data.quantity) {
      throw new ApiError('Insufficient stock for this variant', 400);
    }

    if (data.type === 'addition') {
      variant.stock += data.quantity;
    } else {
      variant.stock -= data.quantity;
    }
  } else {
    if (data.type === 'subtraction' && product.stock < data.quantity) {
      throw new ApiError('Insufficient stock', 400);
    }

    if (data.type === 'addition') {
      product.stock += data.quantity;
    } else {
      product.stock -= data.quantity;
    }
  }

  await product.save();

  const adjustment = await StockAdjustment.create({
    product: data.product,
    variantId: data.variantId,
    warehouse: data.warehouse,
    type: data.type,
    quantity: data.quantity,
    reason: data.reason,
    note: data.note,
    adjustedBy: userId,
  });

  return adjustment;
};

const transferStock = async (data, userId) => {
  if (String(data.fromWarehouse) === String(data.toWarehouse)) {
    throw new ApiError('Source and destination warehouse cannot be the same', 400);
  }

  const product = await Product.findOne({ _id: data.product, isDeleted: false });
  if (!product) {
    throw new ApiError('Product not found', 404);
  }

  // Check source warehouse stock
  const fromEntry = product.warehouseStock.find(
    (ws) => String(ws.warehouse) === String(data.fromWarehouse)
  );
  const sourceQty = fromEntry ? fromEntry.quantity : 0;

  if (sourceQty < data.quantity) {
    throw new ApiError('Insufficient stock in source warehouse', 400);
  }

  // Deduct from source warehouse
  fromEntry.quantity -= data.quantity;

  // Add to destination warehouse
  const toEntry = product.warehouseStock.find(
    (ws) => String(ws.warehouse) === String(data.toWarehouse)
  );
  if (toEntry) {
    toEntry.quantity += data.quantity;
  } else {
    product.warehouseStock.push({
      warehouse: data.toWarehouse,
      quantity: data.quantity,
    });
  }

  await product.save();

  const transfer = await StockTransfer.create({
    product: data.product,
    variantId: data.variantId,
    fromWarehouse: data.fromWarehouse,
    toWarehouse: data.toWarehouse,
    quantity: data.quantity,
    status: data.status || 'completed',
    note: data.note,
    transferredBy: userId,
  });

  return transfer;
};

const getMovements = async (query) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 20;
  const skip = (page - 1) * limit;

  const adjustmentPopulate = [
    { path: 'product', select: 'name sku' },
    { path: 'adjustedBy', select: 'name email' },
  ];

  const transferPopulate = [
    { path: 'product', select: 'name sku' },
    { path: 'transferredBy', select: 'name email' },
    { path: 'fromWarehouse', select: 'name' },
    { path: 'toWarehouse', select: 'name' },
  ];

  const [adjustments, transfers] = await Promise.all([
    StockAdjustment.find().populate(adjustmentPopulate).lean(),
    StockTransfer.find().populate(transferPopulate).lean(),
  ]);

  const movements = [
    ...adjustments.map((a) => ({ ...a, movementType: 'adjustment' })),
    ...transfers.map((t) => ({ ...t, movementType: 'transfer' })),
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const total = movements.length;
  const data = movements.slice(skip, skip + limit);

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

const getAdjustments = async (query) => {
  const filter = {};

  if (query.product) filter.product = query.product;

  const result = await paginate(StockAdjustment, filter, {
    page: query.page,
    limit: query.limit,
    sort: query.sort || { createdAt: -1 },
    populate: [
      { path: 'product', select: 'name sku' },
      { path: 'adjustedBy', select: 'name email' },
      { path: 'warehouse', select: 'name' },
    ],
  });

  return result;
};

const getTransfers = async (query) => {
  const filter = {};

  if (query.product) filter.product = query.product;
  if (query.status) filter.status = query.status;

  const result = await paginate(StockTransfer, filter, {
    page: query.page,
    limit: query.limit,
    sort: query.sort || { createdAt: -1 },
    populate: [
      { path: 'product', select: 'name sku' },
      { path: 'fromWarehouse', select: 'name' },
      { path: 'toWarehouse', select: 'name' },
      { path: 'transferredBy', select: 'name email' },
    ],
  });

  return result;
};

const getAdjustmentById = async (id) => {
  const adj = await StockAdjustment.findById(id)
    .populate('product', 'name sku')
    .populate('warehouse', 'name')
    .populate('adjustedBy', 'name email');
  if (!adj) throw new ApiError('Adjustment not found', 404);
  return adj;
};

const getTransferById = async (id) => {
  const transfer = await StockTransfer.findById(id)
    .populate('product', 'name sku')
    .populate('fromWarehouse', 'name')
    .populate('toWarehouse', 'name')
    .populate('transferredBy', 'name email');
  if (!transfer) throw new ApiError('Transfer not found', 404);
  return transfer;
};

module.exports = {
  getStockList,
  getLowStock,
  adjustStock,
  transferStock,
  getMovements,
  getAdjustments,
  getAdjustmentById,
  getTransfers,
  getTransferById,
};

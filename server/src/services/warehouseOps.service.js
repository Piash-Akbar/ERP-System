const mongoose = require('mongoose');
const Product = require('../models/Product');
const GoodsReceiving = require('../models/GoodsReceiving');
const GoodsIssue = require('../models/GoodsIssue');
const StockTransfer = require('../models/StockTransfer');
const WarehouseReturn = require('../models/WarehouseReturn');
const StockCountSession = require('../models/StockCountSession');
const WarehouseMovement = require('../models/WarehouseMovement');
const WarehouseSettings = require('../models/WarehouseSettings');
const StockAdjustment = require('../models/StockAdjustment');
const ApiError = require('../utils/apiError');
const { paginate } = require('../utils/pagination');
const { generateNumber } = require('../utils/generateNumber');

// ─── HELPERS ────────────────────────────────────────────────

const addWarehouseStock = (product, warehouseId, qty) => {
  const entry = product.warehouseStock.find(
    (ws) => String(ws.warehouse) === String(warehouseId)
  );
  if (entry) {
    entry.quantity += qty;
  } else {
    product.warehouseStock.push({ warehouse: warehouseId, quantity: qty });
  }
  product.stock = (product.stock || 0) + qty;
};

const deductWarehouseStock = (product, warehouseId, qty) => {
  const entry = product.warehouseStock.find(
    (ws) => String(ws.warehouse) === String(warehouseId)
  );
  if (!entry || entry.quantity < qty) {
    throw new ApiError(
      `Insufficient stock for ${product.name} in warehouse (available: ${entry ? entry.quantity : 0}, required: ${qty})`,
      400
    );
  }
  entry.quantity -= qty;
  product.stock = Math.max(0, (product.stock || 0) - qty);
};

// ─── DASHBOARD ──────────────────────────────────────────────

const getDashboard = async (warehouseId) => {
  const warehouseFilter = warehouseId ? { 'warehouseStock.warehouse': new mongoose.Types.ObjectId(warehouseId) } : {};

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [products, todayReceived, todayIssued, pendingTransfers, lowStockProducts] = await Promise.all([
    Product.find({ isDeleted: false, ...warehouseFilter }).lean(),
    GoodsReceiving.aggregate([
      { $match: { status: 'completed', createdAt: { $gte: todayStart }, ...(warehouseId ? { warehouse: new mongoose.Types.ObjectId(warehouseId) } : {}) } },
      { $group: { _id: null, total: { $sum: '$totalQuantity' }, count: { $sum: 1 } } },
    ]),
    GoodsIssue.aggregate([
      { $match: { status: 'completed', createdAt: { $gte: todayStart }, ...(warehouseId ? { warehouse: new mongoose.Types.ObjectId(warehouseId) } : {}) } },
      { $group: { _id: null, total: { $sum: '$totalQuantity' }, count: { $sum: 1 } } },
    ]),
    StockTransfer.countDocuments({ status: 'pending', ...(warehouseId ? { $or: [{ fromWarehouse: warehouseId }, { toWarehouse: warehouseId }] } : {}) }),
    Product.find({
      isDeleted: false,
      $expr: { $lte: ['$stock', '$alertQuantity'] },
    })
      .select('name sku stock alertQuantity')
      .lean(),
  ]);

  let totalStock = 0;
  let stockValue = 0;
  let damagedCount = 0;

  products.forEach((p) => {
    if (warehouseId) {
      const ws = p.warehouseStock?.find((w) => String(w.warehouse) === String(warehouseId));
      if (ws) {
        totalStock += ws.quantity;
        stockValue += ws.quantity * (p.purchasePrice || 0);
      }
    } else {
      totalStock += p.stock || 0;
      stockValue += (p.stock || 0) * (p.purchasePrice || 0);
    }
  });

  return {
    totalStock,
    stockValue,
    todayReceived: todayReceived[0]?.total || 0,
    todayReceivedCount: todayReceived[0]?.count || 0,
    todayIssued: todayIssued[0]?.total || 0,
    todayIssuedCount: todayIssued[0]?.count || 0,
    pendingTransfers,
    lowStockAlerts: lowStockProducts.length,
    damagedStock: damagedCount,
  };
};

const getStockMovementChart = async (warehouseId, days = 7) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  const filter = { date: { $gte: startDate } };
  if (warehouseId) filter.warehouse = new mongoose.Types.ObjectId(warehouseId);

  const movements = await WarehouseMovement.aggregate([
    { $match: filter },
    {
      $group: {
        _id: { date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }, type: '$movementType' },
        total: { $sum: '$quantity' },
      },
    },
    { $sort: { '_id.date': 1 } },
  ]);

  const chartData = {};
  movements.forEach((m) => {
    if (!chartData[m._id.date]) chartData[m._id.date] = { date: m._id.date, received: 0, issued: 0 };
    if (['receiving', 'return', 'transfer_in'].includes(m._id.type)) {
      chartData[m._id.date].received += m.total;
    } else if (['issue', 'transfer_out'].includes(m._id.type)) {
      chartData[m._id.date].issued += m.total;
    }
  });

  return Object.values(chartData);
};

const getStockByCategory = async (warehouseId) => {
  const matchStage = { isDeleted: false };

  const pipeline = [
    { $match: matchStage },
    { $lookup: { from: 'categories', localField: 'category', foreignField: '_id', as: 'cat' } },
    { $unwind: { path: '$cat', preserveNullAndEmptyArrays: true } },
  ];

  if (warehouseId) {
    pipeline.push({ $unwind: '$warehouseStock' });
    pipeline.push({ $match: { 'warehouseStock.warehouse': new mongoose.Types.ObjectId(warehouseId) } });
    pipeline.push({
      $group: {
        _id: '$cat.name',
        totalStock: { $sum: '$warehouseStock.quantity' },
      },
    });
  } else {
    pipeline.push({
      $group: {
        _id: '$cat.name',
        totalStock: { $sum: '$stock' },
      },
    });
  }

  pipeline.push({ $project: { _id: 0, category: { $ifNull: ['$_id', 'Uncategorized'] }, totalStock: 1 } });

  return Product.aggregate(pipeline);
};

// ─── GOODS RECEIVING ────────────────────────────────────────

const getReceivings = async (query) => {
  const filter = {};
  if (query.warehouse) filter.warehouse = query.warehouse;
  if (query.status) filter.status = query.status;
  if (query.branch) filter.branch = query.branch;

  return paginate(GoodsReceiving, filter, {
    page: query.page,
    limit: query.limit,
    sort: { createdAt: -1 },
    populate: [
      { path: 'warehouse', select: 'name code' },
      { path: 'supplier', select: 'name' },
      { path: 'receivedBy', select: 'name email' },
    ],
  });
};

const getReceivingById = async (id) => {
  const doc = await GoodsReceiving.findById(id)
    .populate('warehouse', 'name code')
    .populate('supplier', 'name')
    .populate('receivedBy', 'name email')
    .populate('items.product', 'name sku barcode');
  if (!doc) throw new ApiError('Goods receiving not found', 404);
  return doc;
};

const createReceiving = async (data, userId) => {
  const grnNumber = await generateNumber('GRN', GoodsReceiving, 'grnNumber');

  const totalItems = data.items.length;
  const totalQuantity = data.items.reduce((sum, item) => sum + item.quantity, 0);

  const doc = await GoodsReceiving.create({
    ...data,
    grnNumber,
    totalItems,
    totalQuantity,
    receivedBy: userId,
  });

  return doc;
};

const completeReceiving = async (id, userId) => {
  const doc = await GoodsReceiving.findById(id);
  if (!doc) throw new ApiError('Goods receiving not found', 404);
  if (doc.status !== 'draft') throw new ApiError('Only draft receivings can be completed', 400);

  for (const item of doc.items) {
    const product = await Product.findById(item.product);
    if (!product) throw new ApiError(`Product not found: ${item.product}`, 404);

    if (item.condition === 'good') {
      addWarehouseStock(product, doc.warehouse, item.quantity);
      await product.save();
    }

    await WarehouseMovement.create({
      movementType: 'receiving',
      product: item.product,
      variantId: item.variantId,
      quantity: item.quantity,
      warehouse: doc.warehouse,
      reference: doc.grnNumber,
      referenceModel: 'GoodsReceiving',
      referenceId: doc._id,
      performedBy: userId,
      branch: doc.branch,
      note: item.condition !== 'good' ? `Condition: ${item.condition}` : '',
    });
  }

  doc.status = 'completed';
  await doc.save();
  return doc;
};

const cancelReceiving = async (id) => {
  const doc = await GoodsReceiving.findById(id);
  if (!doc) throw new ApiError('Goods receiving not found', 404);
  if (doc.status !== 'draft') throw new ApiError('Only draft receivings can be cancelled', 400);

  doc.status = 'cancelled';
  await doc.save();
  return doc;
};

// ─── GOODS ISSUE ────────────────────────────────────────────

const getIssues = async (query) => {
  const filter = {};
  if (query.warehouse) filter.warehouse = query.warehouse;
  if (query.status) filter.status = query.status;
  if (query.branch) filter.branch = query.branch;

  return paginate(GoodsIssue, filter, {
    page: query.page,
    limit: query.limit,
    sort: { createdAt: -1 },
    populate: [
      { path: 'warehouse', select: 'name code' },
      { path: 'issuedBy', select: 'name email' },
    ],
  });
};

const getIssueById = async (id) => {
  const doc = await GoodsIssue.findById(id)
    .populate('warehouse', 'name code')
    .populate('issuedBy', 'name email')
    .populate('items.product', 'name sku barcode');
  if (!doc) throw new ApiError('Goods issue not found', 404);
  return doc;
};

const createIssue = async (data, userId) => {
  const issueNumber = await generateNumber('GI', GoodsIssue, 'issueNumber');

  const totalItems = data.items.length;
  const totalQuantity = data.items.reduce((sum, item) => sum + item.quantity, 0);

  const doc = await GoodsIssue.create({
    ...data,
    issueNumber,
    totalItems,
    totalQuantity,
    issuedBy: userId,
  });

  return doc;
};

const completeIssue = async (id, userId) => {
  const doc = await GoodsIssue.findById(id);
  if (!doc) throw new ApiError('Goods issue not found', 404);
  if (doc.status !== 'draft') throw new ApiError('Only draft issues can be completed', 400);

  for (const item of doc.items) {
    const product = await Product.findById(item.product);
    if (!product) throw new ApiError(`Product not found: ${item.product}`, 404);

    deductWarehouseStock(product, doc.warehouse, item.quantity);
    await product.save();

    await WarehouseMovement.create({
      movementType: 'issue',
      product: item.product,
      variantId: item.variantId,
      quantity: item.quantity,
      warehouse: doc.warehouse,
      reference: doc.issueNumber,
      referenceModel: 'GoodsIssue',
      referenceId: doc._id,
      performedBy: userId,
      branch: doc.branch,
    });
  }

  doc.status = 'completed';
  await doc.save();
  return doc;
};

const cancelIssue = async (id) => {
  const doc = await GoodsIssue.findById(id);
  if (!doc) throw new ApiError('Goods issue not found', 404);
  if (doc.status !== 'draft') throw new ApiError('Only draft issues can be cancelled', 400);

  doc.status = 'cancelled';
  await doc.save();
  return doc;
};

// ─── WAREHOUSE TRANSFER ─────────────────────────────────────

const getTransfers = async (query) => {
  const filter = {};
  if (query.warehouse) {
    filter.$or = [{ fromWarehouse: query.warehouse }, { toWarehouse: query.warehouse }];
  }
  if (query.status) filter.status = query.status;

  return paginate(StockTransfer, filter, {
    page: query.page,
    limit: query.limit,
    sort: { createdAt: -1 },
    populate: [
      { path: 'product', select: 'name sku' },
      { path: 'fromWarehouse', select: 'name code' },
      { path: 'toWarehouse', select: 'name code' },
      { path: 'transferredBy', select: 'name email' },
    ],
  });
};

const getPendingTransfers = async (query) => {
  return getTransfers({ ...query, status: 'pending' });
};

const getTransferById = async (id) => {
  const doc = await StockTransfer.findById(id)
    .populate('product', 'name sku barcode')
    .populate('fromWarehouse', 'name code')
    .populate('toWarehouse', 'name code')
    .populate('transferredBy', 'name email');
  if (!doc) throw new ApiError('Transfer not found', 404);
  return doc;
};

const createTransfer = async (data, userId) => {
  if (String(data.fromWarehouse) === String(data.toWarehouse)) {
    throw new ApiError('Source and destination warehouse cannot be the same', 400);
  }

  const transferNumber = await generateNumber('WT', StockTransfer, 'transferNumber');

  const doc = await StockTransfer.create({
    ...data,
    transferNumber,
    status: 'pending',
    transferredBy: userId,
  });

  return doc;
};

const completeTransfer = async (id, userId) => {
  const doc = await StockTransfer.findById(id);
  if (!doc) throw new ApiError('Transfer not found', 404);
  if (doc.status !== 'pending') throw new ApiError('Only pending transfers can be completed', 400);

  const product = await Product.findById(doc.product);
  if (!product) throw new ApiError('Product not found', 404);

  deductWarehouseStock(product, doc.fromWarehouse, doc.quantity);
  addWarehouseStock(product, doc.toWarehouse, doc.quantity);
  // Net change to product.stock is zero since addWarehouseStock adds and deductWarehouseStock subtracts
  // Correct the total: transfer should not change total stock
  product.stock = Math.max(0, product.stock - doc.quantity);
  await product.save();

  await Promise.all([
    WarehouseMovement.create({
      movementType: 'transfer_out',
      product: doc.product,
      variantId: doc.variantId,
      quantity: doc.quantity,
      warehouse: doc.fromWarehouse,
      destinationWarehouse: doc.toWarehouse,
      reference: doc.transferNumber,
      referenceModel: 'StockTransfer',
      referenceId: doc._id,
      performedBy: userId,
      branch: doc.branch,
    }),
    WarehouseMovement.create({
      movementType: 'transfer_in',
      product: doc.product,
      variantId: doc.variantId,
      quantity: doc.quantity,
      warehouse: doc.toWarehouse,
      sourceWarehouse: doc.fromWarehouse,
      reference: doc.transferNumber,
      referenceModel: 'StockTransfer',
      referenceId: doc._id,
      performedBy: userId,
      branch: doc.branch,
    }),
  ]);

  doc.status = 'completed';
  await doc.save();
  return doc;
};

const cancelTransfer = async (id) => {
  const doc = await StockTransfer.findById(id);
  if (!doc) throw new ApiError('Transfer not found', 404);
  if (doc.status !== 'pending') throw new ApiError('Only pending transfers can be cancelled', 400);

  doc.status = 'cancelled';
  await doc.save();
  return doc;
};

// ─── STOCK RECONCILIATION ───────────────────────────────────

const getReconciliation = async (warehouseId, query) => {
  if (!warehouseId) throw new ApiError('Warehouse is required', 400);

  const filter = { isDeleted: false };
  if (query.search) {
    const regex = new RegExp(query.search, 'i');
    filter.$or = [{ name: regex }, { sku: regex }];
  }

  const products = await Product.find(filter)
    .select('name sku barcode stock warehouseStock')
    .lean();

  const items = products
    .map((p) => {
      const ws = p.warehouseStock?.find((w) => String(w.warehouse) === String(warehouseId));
      return {
        product: p._id,
        name: p.name,
        sku: p.sku,
        barcode: p.barcode,
        systemQty: ws ? ws.quantity : 0,
      };
    })
    .filter((item) => item.systemQty > 0 || query.includeZero);

  return {
    totalProducts: items.length,
    items,
  };
};

const applyReconciliationAdjustments = async (data, userId) => {
  const { warehouse, items } = data;
  const results = [];

  for (const item of items) {
    const diff = item.physicalQty - item.systemQty;
    if (diff === 0) continue;

    const product = await Product.findById(item.product);
    if (!product) continue;

    const type = diff > 0 ? 'addition' : 'subtraction';
    const absQty = Math.abs(diff);

    if (type === 'addition') {
      addWarehouseStock(product, warehouse, absQty);
    } else {
      deductWarehouseStock(product, warehouse, absQty);
    }
    await product.save();

    const adjustment = await StockAdjustment.create({
      product: item.product,
      warehouse,
      type,
      quantity: absQty,
      reason: item.reason || 'Stock reconciliation adjustment',
      adjustedBy: userId,
    });

    await WarehouseMovement.create({
      movementType: 'adjustment',
      product: item.product,
      quantity: absQty,
      warehouse,
      reference: `RECON-${adjustment._id}`,
      referenceModel: 'StockAdjustment',
      referenceId: adjustment._id,
      performedBy: userId,
      note: item.reason || 'Stock reconciliation',
    });

    results.push(adjustment);
  }

  return results;
};

// ─── PHYSICAL STOCK COUNT ───────────────────────────────────

const getCountSessions = async (query) => {
  const filter = {};
  if (query.warehouse) filter.warehouse = query.warehouse;
  if (query.status) filter.status = query.status;

  return paginate(StockCountSession, filter, {
    page: query.page,
    limit: query.limit,
    sort: { createdAt: -1 },
    populate: [
      { path: 'warehouse', select: 'name code' },
      { path: 'createdBy', select: 'name email' },
    ],
  });
};

const getCountSessionById = async (id) => {
  const doc = await StockCountSession.findById(id)
    .populate('warehouse', 'name code')
    .populate('createdBy', 'name email')
    .populate('items.product', 'name sku barcode');
  if (!doc) throw new ApiError('Count session not found', 404);
  return doc;
};

const createCountSession = async (data, userId) => {
  const sessionNumber = await generateNumber('SC', StockCountSession, 'sessionNumber');

  const products = await Product.find({ isDeleted: false }).select('_id name sku barcode warehouseStock').lean();

  const items = products
    .map((p) => {
      const ws = p.warehouseStock?.find((w) => String(w.warehouse) === String(data.warehouse));
      return {
        product: p._id,
        barcode: p.barcode,
        systemQuantity: ws ? ws.quantity : 0,
        countedQuantity: 0,
        difference: 0,
        status: 'pending',
      };
    })
    .filter((item) => item.systemQuantity > 0);

  const doc = await StockCountSession.create({
    ...data,
    sessionNumber,
    items,
    totalProducts: items.length,
    createdBy: userId,
  });

  return doc;
};

const startCountSession = async (id) => {
  const doc = await StockCountSession.findById(id);
  if (!doc) throw new ApiError('Count session not found', 404);
  if (doc.status !== 'not_started') throw new ApiError('Session has already been started', 400);

  doc.status = 'in_progress';
  doc.startedAt = new Date();
  await doc.save();
  return doc;
};

const scanCountItem = async (sessionId, data) => {
  const doc = await StockCountSession.findById(sessionId).populate('items.product', 'name sku barcode');
  if (!doc) throw new ApiError('Count session not found', 404);
  if (doc.status !== 'in_progress') throw new ApiError('Session is not in progress', 400);

  let product;
  if (data.barcode) {
    product = await Product.findOne({ barcode: data.barcode, isDeleted: false }).select('_id name sku barcode');
    if (!product) throw new ApiError('Product not found for this barcode', 404);
  } else if (data.productId) {
    product = await Product.findById(data.productId).select('_id name sku barcode');
    if (!product) throw new ApiError('Product not found', 404);
  }

  let item = doc.items.find((i) => String(i.product._id || i.product) === String(product._id));

  if (item) {
    item.countedQuantity += data.quantity || 1;
    item.difference = item.countedQuantity - item.systemQuantity;
    item.status = 'counted';
    item.countedAt = new Date();
  } else {
    doc.items.push({
      product: product._id,
      barcode: product.barcode,
      systemQuantity: 0,
      countedQuantity: data.quantity || 1,
      difference: data.quantity || 1,
      status: 'counted',
      countedAt: new Date(),
    });
  }

  doc.itemsCounted = doc.items.filter((i) => i.status === 'counted').length;
  doc.totalVariance = doc.items.reduce((sum, i) => sum + Math.abs(i.difference), 0);
  await doc.save();

  return doc;
};

const completeCountSession = async (id, userId) => {
  const doc = await StockCountSession.findById(id);
  if (!doc) throw new ApiError('Count session not found', 404);
  if (doc.status !== 'in_progress') throw new ApiError('Session is not in progress', 400);

  // Apply adjustments for items with differences
  for (const item of doc.items) {
    if (item.difference === 0) continue;

    const product = await Product.findById(item.product);
    if (!product) continue;

    const type = item.difference > 0 ? 'addition' : 'subtraction';
    const absQty = Math.abs(item.difference);

    if (type === 'addition') {
      addWarehouseStock(product, doc.warehouse, absQty);
    } else {
      deductWarehouseStock(product, doc.warehouse, absQty);
    }
    await product.save();

    await WarehouseMovement.create({
      movementType: 'count_adjustment',
      product: item.product,
      quantity: absQty,
      warehouse: doc.warehouse,
      reference: doc.sessionNumber,
      referenceModel: 'StockCountSession',
      referenceId: doc._id,
      performedBy: userId,
      branch: doc.branch,
      note: `Count adjustment: system=${item.systemQuantity}, counted=${item.countedQuantity}`,
    });
  }

  doc.status = 'completed';
  doc.completedAt = new Date();
  await doc.save();
  return doc;
};

const resetCountSession = async (id) => {
  const doc = await StockCountSession.findById(id);
  if (!doc) throw new ApiError('Count session not found', 404);
  if (!['not_started', 'in_progress'].includes(doc.status)) {
    throw new ApiError('Cannot reset a completed or cancelled session', 400);
  }

  doc.items.forEach((item) => {
    item.countedQuantity = 0;
    item.difference = 0;
    item.status = 'pending';
    item.countedAt = undefined;
  });
  doc.itemsCounted = 0;
  doc.totalVariance = 0;
  doc.status = 'not_started';
  doc.startedAt = undefined;
  await doc.save();
  return doc;
};

// ─── WAREHOUSE LEDGER ───────────────────────────────────────

const getLedger = async (query) => {
  const filter = {};
  if (query.warehouse) filter.warehouse = query.warehouse;
  if (query.movementType) filter.movementType = query.movementType;
  if (query.product) filter.product = query.product;
  if (query.branch) filter.branch = query.branch;
  if (query.dateFrom || query.dateTo) {
    filter.date = {};
    if (query.dateFrom) filter.date.$gte = new Date(query.dateFrom);
    if (query.dateTo) {
      const to = new Date(query.dateTo);
      to.setHours(23, 59, 59, 999);
      filter.date.$lte = to;
    }
  }

  return paginate(WarehouseMovement, filter, {
    page: query.page,
    limit: query.limit,
    sort: { date: -1 },
    populate: [
      { path: 'product', select: 'name sku barcode' },
      { path: 'warehouse', select: 'name code' },
      { path: 'sourceWarehouse', select: 'name code' },
      { path: 'destinationWarehouse', select: 'name code' },
      { path: 'performedBy', select: 'name email' },
    ],
  });
};

const getLedgerSummary = async (query) => {
  const filter = {};
  if (query.warehouse) filter.warehouse = new mongoose.Types.ObjectId(query.warehouse);
  if (query.dateFrom || query.dateTo) {
    filter.date = {};
    if (query.dateFrom) filter.date.$gte = new Date(query.dateFrom);
    if (query.dateTo) {
      const to = new Date(query.dateTo);
      to.setHours(23, 59, 59, 999);
      filter.date.$lte = to;
    }
  }

  const result = await WarehouseMovement.aggregate([
    { $match: filter },
    {
      $group: {
        _id: '$movementType',
        total: { $sum: '$quantity' },
        count: { $sum: 1 },
      },
    },
  ]);

  let totalMovements = 0;
  let totalReceived = 0;
  let totalIssued = 0;

  result.forEach((r) => {
    totalMovements += r.count;
    if (['receiving', 'return', 'transfer_in'].includes(r._id)) totalReceived += r.total;
    if (['issue', 'transfer_out'].includes(r._id)) totalIssued += r.total;
  });

  return { totalMovements, totalReceived, totalIssued };
};

const exportLedgerCSV = async (query) => {
  const filter = {};
  if (query.warehouse) filter.warehouse = query.warehouse;
  if (query.movementType) filter.movementType = query.movementType;
  if (query.dateFrom || query.dateTo) {
    filter.date = {};
    if (query.dateFrom) filter.date.$gte = new Date(query.dateFrom);
    if (query.dateTo) {
      const to = new Date(query.dateTo);
      to.setHours(23, 59, 59, 999);
      filter.date.$lte = to;
    }
  }

  const movements = await WarehouseMovement.find(filter)
    .sort({ date: -1 })
    .populate('product', 'name sku')
    .populate('warehouse', 'name')
    .populate('sourceWarehouse', 'name')
    .populate('destinationWarehouse', 'name')
    .populate('performedBy', 'name')
    .lean();

  const header = 'Date,Type,Product,SKU,Quantity,Warehouse,Source/Destination,Reference,Performed By\n';
  const rows = movements.map((m) => {
    const date = m.date ? new Date(m.date).toISOString() : '';
    const srcDest = m.sourceWarehouse?.name || m.destinationWarehouse?.name || '';
    return `"${date}","${m.movementType}","${m.product?.name || ''}","${m.product?.sku || ''}",${m.quantity},"${m.warehouse?.name || ''}","${srcDest}","${m.reference || ''}","${m.performedBy?.name || ''}"`;
  });

  return header + rows.join('\n');
};

// ─── WAREHOUSE RETURNS ──────────────────────────────────────

const getReturns = async (query) => {
  const filter = {};
  if (query.warehouse) filter.warehouse = query.warehouse;
  if (query.status) filter.status = query.status;
  if (query.branch) filter.branch = query.branch;

  return paginate(WarehouseReturn, filter, {
    page: query.page,
    limit: query.limit,
    sort: { createdAt: -1 },
    populate: [
      { path: 'warehouse', select: 'name code' },
      { path: 'processedBy', select: 'name email' },
    ],
  });
};

const getReturnById = async (id) => {
  const doc = await WarehouseReturn.findById(id)
    .populate('warehouse', 'name code')
    .populate('processedBy', 'name email')
    .populate('items.product', 'name sku barcode');
  if (!doc) throw new ApiError('Warehouse return not found', 404);
  return doc;
};

const createReturn = async (data, userId) => {
  const returnNumber = await generateNumber('WR', WarehouseReturn, 'returnNumber');

  const totalItems = data.items.length;
  const totalQuantity = data.items.reduce((sum, item) => sum + item.quantity, 0);

  const doc = await WarehouseReturn.create({
    ...data,
    returnNumber,
    totalItems,
    totalQuantity,
    processedBy: userId,
  });

  return doc;
};

const completeReturn = async (id, userId) => {
  const doc = await WarehouseReturn.findById(id);
  if (!doc) throw new ApiError('Warehouse return not found', 404);
  if (doc.status !== 'draft') throw new ApiError('Only draft returns can be completed', 400);

  for (const item of doc.items) {
    const product = await Product.findById(item.product);
    if (!product) throw new ApiError(`Product not found: ${item.product}`, 404);

    if (item.condition === 'good') {
      addWarehouseStock(product, doc.warehouse, item.quantity);
      await product.save();
    }

    await WarehouseMovement.create({
      movementType: 'return',
      product: item.product,
      variantId: item.variantId,
      quantity: item.quantity,
      warehouse: doc.warehouse,
      reference: doc.returnNumber,
      referenceModel: 'WarehouseReturn',
      referenceId: doc._id,
      performedBy: userId,
      branch: doc.branch,
      note: item.condition !== 'good' ? `Condition: ${item.condition}` : '',
    });
  }

  doc.status = 'completed';
  await doc.save();
  return doc;
};

const cancelReturn = async (id) => {
  const doc = await WarehouseReturn.findById(id);
  if (!doc) throw new ApiError('Warehouse return not found', 404);
  if (doc.status !== 'draft') throw new ApiError('Only draft returns can be cancelled', 400);

  doc.status = 'cancelled';
  await doc.save();
  return doc;
};

// ─── SETTINGS ───────────────────────────────────────────────

const getWarehouseSettings = async (userId, warehouseId) => {
  let settings = await WarehouseSettings.findOne({
    user: userId,
    warehouse: warehouseId || null,
  });

  if (!settings) {
    settings = {
      scanSettings: { continuousScanMode: true, autoSubmit: false, soundFeedback: true },
      offlineSync: { enabled: false },
    };
  }

  return settings;
};

const updateWarehouseSettings = async (userId, data) => {
  const settings = await WarehouseSettings.findOneAndUpdate(
    { user: userId, warehouse: data.warehouse || null },
    { ...data, user: userId },
    { new: true, upsert: true }
  );

  return settings;
};

// ─── BARCODE SCAN ───────────────────────────────────────────

const scanBarcode = async (barcode) => {
  const product = await Product.findOne({
    $or: [{ barcode }, { 'variants.barcode': barcode }],
    isDeleted: false,
  })
    .populate('category', 'name')
    .populate('brand', 'name')
    .lean();

  if (!product) throw new ApiError('Product not found for this barcode', 404);

  return product;
};

module.exports = {
  getDashboard,
  getStockMovementChart,
  getStockByCategory,
  getReceivings,
  getReceivingById,
  createReceiving,
  completeReceiving,
  cancelReceiving,
  getIssues,
  getIssueById,
  createIssue,
  completeIssue,
  cancelIssue,
  getTransfers,
  getPendingTransfers,
  getTransferById,
  createTransfer,
  completeTransfer,
  cancelTransfer,
  getReconciliation,
  applyReconciliationAdjustments,
  getCountSessions,
  getCountSessionById,
  createCountSession,
  startCountSession,
  scanCountItem,
  completeCountSession,
  resetCountSession,
  getLedger,
  getLedgerSummary,
  exportLedgerCSV,
  getReturns,
  getReturnById,
  createReturn,
  completeReturn,
  cancelReturn,
  getWarehouseSettings,
  updateWarehouseSettings,
  scanBarcode,
};

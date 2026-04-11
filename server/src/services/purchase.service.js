const Purchase = require('../models/Purchase');
const Product = require('../models/Product');
const Contact = require('../models/Contact');
const ApiError = require('../utils/apiError');
const { paginate } = require('../utils/pagination');

const generateRefNo = async () => {
  const last = await Purchase.findOne({ isReturn: false }).sort({ createdAt: -1 }).select('referenceNo');
  if (!last) return 'PO-0001';
  const num = parseInt(last.referenceNo.split('-')[1]) + 1;
  return `PO-${String(num).padStart(4, '0')}`;
};

const getAll = async (query) => {
  const filter = { isDeleted: false };
  if (query.status) filter.status = query.status;
  if (query.paymentStatus) filter.paymentStatus = query.paymentStatus;
  if (query.supplier) filter.supplier = query.supplier;
  if (query.isReturn !== undefined) filter.isReturn = query.isReturn === 'true';
  if (query.startDate || query.endDate) {
    filter.purchaseDate = {};
    if (query.startDate) filter.purchaseDate.$gte = new Date(query.startDate);
    if (query.endDate) filter.purchaseDate.$lte = new Date(query.endDate);
  }
  if (query.search) {
    filter.referenceNo = { $regex: query.search, $options: 'i' };
  }

  return paginate(Purchase, filter, {
    page: query.page,
    limit: query.limit,
    sort: { createdAt: -1 },
    populate: [
      { path: 'supplier', select: 'name company phone' },
      { path: 'createdBy', select: 'name' },
    ],
  });
};

const getById = async (id) => {
  const purchase = await Purchase.findById(id)
    .populate('supplier')
    .populate('items.product', 'name sku')
    .populate('payments.account', 'name')
    .populate('createdBy', 'name');
  if (!purchase || purchase.isDeleted) throw new ApiError('Purchase not found', 404);
  return purchase;
};

const create = async (data, userId) => {
  data.referenceNo = await generateRefNo();
  data.createdBy = userId;

  let subtotal = 0;
  for (const item of data.items) {
    item.subtotal = item.quantity * item.unitPrice - (item.discount || 0);
    subtotal += item.subtotal;
  }

  data.subtotal = subtotal;
  data.grandTotal = subtotal - (data.discountAmount || 0) + (data.taxAmount || 0) + (data.shippingCharge || 0) + (data.otherCharge || 0);

  data.paidAmount = (data.payments || []).reduce((sum, p) => sum + p.amount, 0);
  data.dueAmount = data.grandTotal - data.paidAmount;
  data.paymentStatus = data.dueAmount <= 0 ? 'paid' : data.paidAmount > 0 ? 'partial' : 'unpaid';

  const purchase = await Purchase.create(data);

  // Update stock (add)
  if (data.status === 'received') {
    for (const item of data.items) {
      const product = await Product.findById(item.product);
      if (!product) continue;
      if (item.variantId) {
        const variant = product.variants.id(item.variantId);
        if (variant) variant.stock += item.quantity;
      } else {
        product.stock += item.quantity;
      }
      await product.save();
    }
  }

  // Update supplier due
  const supplier = await Contact.findById(data.supplier);
  if (supplier) {
    supplier.currentDue = (supplier.currentDue || 0) + data.dueAmount;
    await supplier.save();
  }

  return purchase;
};

const addPayment = async (purchaseId, payment) => {
  const purchase = await Purchase.findById(purchaseId);
  if (!purchase) throw new ApiError('Purchase not found', 404);

  purchase.payments.push(payment);
  purchase.paidAmount = purchase.payments.reduce((sum, p) => sum + p.amount, 0);
  purchase.dueAmount = purchase.grandTotal - purchase.paidAmount;
  purchase.paymentStatus = purchase.dueAmount <= 0 ? 'paid' : purchase.paidAmount > 0 ? 'partial' : 'unpaid';

  const supplier = await Contact.findById(purchase.supplier);
  if (supplier) {
    supplier.currentDue = Math.max(0, (supplier.currentDue || 0) - payment.amount);
    await supplier.save();
  }

  await purchase.save();
  return purchase;
};

const createReturn = async (purchaseId, returnItems, userId) => {
  const original = await Purchase.findById(purchaseId);
  if (!original) throw new ApiError('Original purchase not found', 404);

  const returnRef = `PRET-${original.referenceNo}`;
  let returnTotal = 0;

  for (const ri of returnItems) {
    const origItem = original.items.id(ri.itemId);
    if (!origItem) throw new ApiError('Purchase item not found', 404);
    ri.subtotal = ri.quantity * origItem.unitPrice;
    returnTotal += ri.subtotal;

    // Reduce stock
    const product = await Product.findById(origItem.product);
    if (ri.variantId) {
      const variant = product.variants.id(ri.variantId);
      if (variant) variant.stock = Math.max(0, variant.stock - ri.quantity);
    } else {
      product.stock = Math.max(0, product.stock - ri.quantity);
    }
    await product.save();
  }

  const returnPurchase = await Purchase.create({
    referenceNo: returnRef,
    supplier: original.supplier,
    purchaseDate: new Date(),
    items: returnItems.map((ri) => {
      const origItem = original.items.id(ri.itemId);
      return {
        product: origItem.product,
        variantId: origItem.variantId,
        name: origItem.name,
        sku: origItem.sku,
        quantity: ri.quantity,
        unitPrice: origItem.unitPrice,
        subtotal: ri.subtotal,
      };
    }),
    subtotal: returnTotal,
    grandTotal: returnTotal,
    status: 'returned',
    paymentStatus: 'paid',
    isReturn: true,
    returnRef: purchaseId,
    createdBy: userId,
  });

  const supplier = await Contact.findById(original.supplier);
  if (supplier) {
    supplier.currentDue = Math.max(0, (supplier.currentDue || 0) - returnTotal);
    await supplier.save();
  }

  original.status = 'returned';
  await original.save();

  return returnPurchase;
};

const deletePurchase = async (id) => {
  const purchase = await Purchase.findById(id);
  if (!purchase) throw new ApiError('Purchase not found', 404);
  purchase.isDeleted = true;
  await purchase.save();
  return purchase;
};

const addDocuments = async (id, filePaths) => {
  const purchase = await Purchase.findOne({ _id: id, isDeleted: false });
  if (!purchase) throw new ApiError('Purchase not found', 404);
  purchase.documents.push(...filePaths);
  await purchase.save();
  return purchase;
};

const removeDocument = async (id, filePath) => {
  const purchase = await Purchase.findOne({ _id: id, isDeleted: false });
  if (!purchase) throw new ApiError('Purchase not found', 404);
  purchase.documents = purchase.documents.filter((doc) => doc !== filePath);
  await purchase.save();
  return purchase;
};

module.exports = { getAll, getById, create, addPayment, createReturn, deletePurchase, addDocuments, removeDocument };

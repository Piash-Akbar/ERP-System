const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Contact = require('../models/Contact');
const ApiError = require('../utils/apiError');
const { paginate } = require('../utils/pagination');

const generateInvoiceNo = async () => {
  const last = await Sale.findOne({ isReturn: false }).sort({ createdAt: -1 }).select('invoiceNo');
  if (!last) return 'INV-0001';
  const num = parseInt(last.invoiceNo.split('-')[1]) + 1;
  return `INV-${String(num).padStart(4, '0')}`;
};

const getAll = async (query) => {
  const filter = { isDeleted: false };
  if (query.status) filter.status = query.status;
  if (query.paymentStatus) filter.paymentStatus = query.paymentStatus;
  if (query.customer) filter.customer = query.customer;
  if (query.isReturn !== undefined) filter.isReturn = query.isReturn === 'true';
  if (query.startDate || query.endDate) {
    filter.saleDate = {};
    if (query.startDate) filter.saleDate.$gte = new Date(query.startDate);
    if (query.endDate) filter.saleDate.$lte = new Date(query.endDate);
  }
  if (query.search) {
    filter.invoiceNo = { $regex: query.search, $options: 'i' };
  }

  return paginate(Sale, filter, {
    page: query.page,
    limit: query.limit,
    sort: { createdAt: -1 },
    populate: [
      { path: 'customer', select: 'name company phone' },
      { path: 'createdBy', select: 'name' },
    ],
  });
};

const getById = async (id) => {
  const sale = await Sale.findById(id)
    .populate('customer')
    .populate('items.product', 'name sku')
    .populate('payments.account', 'name')
    .populate('createdBy', 'name');
  if (!sale || sale.isDeleted) throw new ApiError('Sale not found', 404);
  return sale;
};

const create = async (data, userId) => {
  // Generate invoice number
  data.invoiceNo = await generateInvoiceNo();
  data.createdBy = userId;

  // Calculate totals
  let subtotal = 0;
  for (const item of data.items) {
    // Validate minimum price
    const product = await Product.findById(item.product);
    if (!product) throw new ApiError(`Product not found: ${item.product}`, 404);

    const minPrice = item.variantId
      ? product.variants.id(item.variantId)?.minSellingPrice || 0
      : product.minSellingPrice;

    if (minPrice > 0 && item.unitPrice < minPrice) {
      throw new ApiError(`Price for ${product.name} cannot be below minimum: ${minPrice}`, 400);
    }

    item.subtotal = item.quantity * item.unitPrice - (item.discount || 0);
    subtotal += item.subtotal;
  }

  data.subtotal = subtotal;
  const taxableAmount = subtotal - (data.discountAmount || 0);
  data.taxAmount = data.taxAmount || 0;
  data.grandTotal = taxableAmount + data.taxAmount + (data.shippingCharge || 0) + (data.otherCharge || 0);

  // Get customer previous due
  const customer = await Contact.findById(data.customer);
  if (!customer) throw new ApiError('Customer not found', 404);
  data.previousDue = customer.currentDue || 0;

  // Calculate payment
  data.paidAmount = (data.payments || []).reduce((sum, p) => sum + p.amount, 0);
  data.dueAmount = data.grandTotal - data.paidAmount;
  data.paymentStatus = data.dueAmount <= 0 ? 'paid' : data.paidAmount > 0 ? 'partial' : 'unpaid';

  const sale = await Sale.create(data);

  // Update stock
  for (const item of data.items) {
    const product = await Product.findById(item.product);
    if (item.variantId) {
      const variant = product.variants.id(item.variantId);
      if (variant) {
        if (variant.stock < item.quantity) throw new ApiError(`Insufficient stock for ${variant.name}`, 400);
        variant.stock -= item.quantity;
      }
    } else {
      if (product.stock < item.quantity) throw new ApiError(`Insufficient stock for ${product.name}`, 400);
      product.stock -= item.quantity;
    }
    await product.save();
  }

  // Update customer due
  customer.currentDue = (customer.currentDue || 0) + data.dueAmount;
  await customer.save();

  return sale;
};

const addPayment = async (saleId, payment) => {
  const sale = await Sale.findById(saleId);
  if (!sale) throw new ApiError('Sale not found', 404);

  sale.payments.push(payment);
  sale.paidAmount = sale.payments.reduce((sum, p) => sum + p.amount, 0);
  sale.dueAmount = sale.grandTotal - sale.paidAmount;
  sale.paymentStatus = sale.dueAmount <= 0 ? 'paid' : sale.paidAmount > 0 ? 'partial' : 'unpaid';

  // Update customer due
  const customer = await Contact.findById(sale.customer);
  if (customer) {
    customer.currentDue = Math.max(0, (customer.currentDue || 0) - payment.amount);
    await customer.save();
  }

  await sale.save();
  return sale;
};

const createReturn = async (saleId, returnItems, userId) => {
  const original = await Sale.findById(saleId).populate('items.product');
  if (!original) throw new ApiError('Original sale not found', 404);

  const returnInvoice = `RET-${original.invoiceNo}`;

  let returnTotal = 0;
  for (const ri of returnItems) {
    const origItem = original.items.id(ri.itemId);
    if (!origItem) throw new ApiError('Sale item not found', 404);
    ri.subtotal = ri.quantity * origItem.unitPrice;
    returnTotal += ri.subtotal;

    // Restore stock
    const product = await Product.findById(origItem.product);
    if (ri.variantId) {
      const variant = product.variants.id(ri.variantId);
      if (variant) variant.stock += ri.quantity;
    } else {
      product.stock += ri.quantity;
    }
    await product.save();
  }

  const returnSale = await Sale.create({
    invoiceNo: returnInvoice,
    customer: original.customer,
    saleDate: new Date(),
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
    paidAmount: 0,
    dueAmount: 0,
    status: 'returned',
    paymentStatus: 'paid',
    isReturn: true,
    returnRef: saleId,
    createdBy: userId,
  });

  // Update customer due
  const customer = await Contact.findById(original.customer);
  if (customer) {
    customer.currentDue = Math.max(0, (customer.currentDue || 0) - returnTotal);
    await customer.save();
  }

  original.status = 'returned';
  await original.save();

  return returnSale;
};

const deleteSale = async (id) => {
  const sale = await Sale.findById(id);
  if (!sale) throw new ApiError('Sale not found', 404);
  sale.isDeleted = true;
  await sale.save();
  return sale;
};

module.exports = { getAll, getById, create, addPayment, createReturn, deleteSale };

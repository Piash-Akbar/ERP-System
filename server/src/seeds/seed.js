require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const { ROLES, MODULES, PERMISSIONS } = require('../config/constants');

// Models
const Role = require('../models/Role');
const User = require('../models/User');
const Branch = require('../models/Branch');
const Warehouse = require('../models/Warehouse');
const Category = require('../models/Category');
const Brand = require('../models/Brand');
const Unit = require('../models/Unit');
const Tax = require('../models/Tax');
const Contact = require('../models/Contact');
const Product = require('../models/Product');
const BankAccount = require('../models/BankAccount');
const LeaveType = require('../models/LeaveType');
const Staff = require('../models/Staff');
const Holiday = require('../models/Holiday');
const Sale = require('../models/Sale');
const Purchase = require('../models/Purchase');
const Transaction = require('../models/Transaction');
const Attendance = require('../models/Attendance');
const Notification = require('../models/Notification');
const BOM = require('../models/BOM');
const ProductionPlan = require('../models/ProductionPlan');
const WorkOrder = require('../models/WorkOrder');
const SubcontractingItem = require('../models/SubcontractingItem');
const SubcontractingOrder = require('../models/SubcontractingOrder');

// ─── ROLES ──────────────────────────────────────────────
const allPermissions = Object.values(MODULES).map((mod) => ({
  module: mod,
  actions: Object.values(PERMISSIONS),
}));

const rolesData = [
  { name: ROLES.SUPER_ADMIN, displayName: 'Super Admin', description: 'Full system access', permissions: allPermissions },
  { name: ROLES.ADMIN, displayName: 'Admin', description: 'Administrative access', permissions: allPermissions },
  {
    name: ROLES.SALES_MANAGER, displayName: 'Sales Manager', description: 'Manages sales operations',
    permissions: [
      { module: MODULES.DASHBOARD, actions: [PERMISSIONS.VIEW] },
      { module: MODULES.SALES, actions: Object.values(PERMISSIONS) },
      { module: MODULES.CONTACTS, actions: [PERMISSIONS.VIEW, PERMISSIONS.CREATE, PERMISSIONS.EDIT] },
      { module: MODULES.PRODUCTS, actions: [PERMISSIONS.VIEW] },
      { module: MODULES.INVENTORY, actions: [PERMISSIONS.VIEW] },
    ],
  },
  {
    name: ROLES.PURCHASE_OFFICER, displayName: 'Purchase Officer', description: 'Manages purchase operations',
    permissions: [
      { module: MODULES.DASHBOARD, actions: [PERMISSIONS.VIEW] },
      { module: MODULES.PURCHASE, actions: Object.values(PERMISSIONS) },
      { module: MODULES.CONTACTS, actions: [PERMISSIONS.VIEW, PERMISSIONS.CREATE, PERMISSIONS.EDIT] },
      { module: MODULES.PRODUCTS, actions: [PERMISSIONS.VIEW] },
      { module: MODULES.INVENTORY, actions: [PERMISSIONS.VIEW] },
      { module: MODULES.CNF, actions: Object.values(PERMISSIONS) },
    ],
  },
  {
    name: ROLES.INVENTORY_MANAGER, displayName: 'Inventory Manager', description: 'Manages inventory',
    permissions: [
      { module: MODULES.DASHBOARD, actions: [PERMISSIONS.VIEW] },
      { module: MODULES.INVENTORY, actions: Object.values(PERMISSIONS) },
      { module: MODULES.PRODUCTS, actions: [PERMISSIONS.VIEW, PERMISSIONS.CREATE, PERMISSIONS.EDIT] },
      { module: MODULES.TRANSFER, actions: [PERMISSIONS.VIEW, PERMISSIONS.CREATE] },
      { module: MODULES.MANUFACTURING, actions: [PERMISSIONS.VIEW, PERMISSIONS.CREATE, PERMISSIONS.EDIT] },
    ],
  },
  {
    name: ROLES.ACCOUNTANT, displayName: 'Accountant', description: 'Manages finances',
    permissions: [
      { module: MODULES.DASHBOARD, actions: [PERMISSIONS.VIEW] },
      { module: MODULES.ACCOUNTS, actions: Object.values(PERMISSIONS) },
      { module: MODULES.SALES, actions: [PERMISSIONS.VIEW] },
      { module: MODULES.PURCHASE, actions: [PERMISSIONS.VIEW] },
      { module: MODULES.TRANSFER, actions: [PERMISSIONS.VIEW, PERMISSIONS.CREATE] },
    ],
  },
  {
    name: ROLES.HR_MANAGER, displayName: 'HR Manager', description: 'Manages human resources',
    permissions: [
      { module: MODULES.DASHBOARD, actions: [PERMISSIONS.VIEW] },
      { module: MODULES.HRM, actions: Object.values(PERMISSIONS) },
      { module: MODULES.LEAVE, actions: Object.values(PERMISSIONS) },
    ],
  },
  {
    name: ROLES.BRANCH_MANAGER, displayName: 'Branch Manager', description: 'Manages branch operations',
    permissions: [
      { module: MODULES.DASHBOARD, actions: [PERMISSIONS.VIEW] },
      { module: MODULES.SALES, actions: [PERMISSIONS.VIEW, PERMISSIONS.CREATE, PERMISSIONS.EDIT] },
      { module: MODULES.PURCHASE, actions: [PERMISSIONS.VIEW] },
      { module: MODULES.INVENTORY, actions: [PERMISSIONS.VIEW] },
      { module: MODULES.HRM, actions: [PERMISSIONS.VIEW] },
      { module: MODULES.LOCATIONS, actions: [PERMISSIONS.VIEW] },
    ],
  },
  {
    name: ROLES.STAFF, displayName: 'Staff', description: 'Basic staff access', isDefault: true,
    permissions: [
      { module: MODULES.DASHBOARD, actions: [PERMISSIONS.VIEW] },
      { module: MODULES.LEAVE, actions: [PERMISSIONS.VIEW, PERMISSIONS.CREATE] },
    ],
  },
];

// ─── SEED FUNCTIONS ─────────────────────────────────────

async function seedRoles() {
  for (const r of rolesData) {
    await Role.findOneAndUpdate({ name: r.name }, r, { upsert: true, new: true });
  }
  console.log('  Roles seeded');
}

async function seedBranches() {
  const branches = [
    { name: 'Head Office', code: 'HO', address: '123 Motijheel, Dhaka', phone: '01700000001', email: 'ho@annexleather.com' },
    { name: 'Chittagong Branch', code: 'CTG', address: '45 Agrabad, Chittagong', phone: '01700000002', email: 'ctg@annexleather.com' },
    { name: 'Factory Unit', code: 'FAC', address: '78 Hazaribagh, Dhaka', phone: '01700000003', email: 'factory@annexleather.com' },
  ];
  for (const b of branches) {
    await Branch.findOneAndUpdate({ code: b.code }, b, { upsert: true, new: true });
  }
  console.log('  Branches seeded');
}

async function seedWarehouses() {
  const ho = await Branch.findOne({ code: 'HO' });
  const ctg = await Branch.findOne({ code: 'CTG' });
  const fac = await Branch.findOne({ code: 'FAC' });

  const warehouses = [
    { name: 'Main Warehouse', code: 'WH-MAIN', address: 'Motijheel, Dhaka', branch: ho._id },
    { name: 'Chittagong Warehouse', code: 'WH-CTG', address: 'Agrabad, Chittagong', branch: ctg._id },
    { name: 'Factory Raw Materials', code: 'WH-RAW', address: 'Hazaribagh, Dhaka', branch: fac._id },
    { name: 'Finished Goods Store', code: 'WH-FIN', address: 'Hazaribagh, Dhaka', branch: fac._id },
  ];
  for (const w of warehouses) {
    await Warehouse.findOneAndUpdate({ code: w.code }, w, { upsert: true, new: true });
  }
  console.log('  Warehouses seeded');
}

async function seedUsers() {
  const roles = {};
  for (const r of Object.values(ROLES)) {
    roles[r] = await Role.findOne({ name: r });
  }
  const ho = await Branch.findOne({ code: 'HO' });
  const ctg = await Branch.findOne({ code: 'CTG' });

  const users = [
    { name: 'Super Admin', email: 'admin@annexleather.com', password: 'Admin@123', role: roles.super_admin._id, phone: '01700000001' },
    { name: 'Rahim Uddin', email: 'rahim@annexleather.com', password: 'Pass@123', role: roles.admin._id, branch: ho._id, phone: '01711111111' },
    { name: 'Karim Hossain', email: 'karim@annexleather.com', password: 'Pass@123', role: roles.sales_manager._id, branch: ho._id, phone: '01722222222' },
    { name: 'Jamal Ahmed', email: 'jamal@annexleather.com', password: 'Pass@123', role: roles.purchase_officer._id, branch: ho._id, phone: '01733333333' },
    { name: 'Sumon Das', email: 'sumon@annexleather.com', password: 'Pass@123', role: roles.inventory_manager._id, branch: ho._id, phone: '01744444444' },
    { name: 'Nasrin Akter', email: 'nasrin@annexleather.com', password: 'Pass@123', role: roles.accountant._id, branch: ho._id, phone: '01755555555' },
    { name: 'Fatema Begum', email: 'fatema@annexleather.com', password: 'Pass@123', role: roles.hr_manager._id, branch: ho._id, phone: '01766666666' },
    { name: 'Anwar Sheikh', email: 'anwar@annexleather.com', password: 'Pass@123', role: roles.branch_manager._id, branch: ctg._id, phone: '01777777777' },
    { name: 'Babul Mia', email: 'babul@annexleather.com', password: 'Pass@123', role: roles.staff._id, branch: ho._id, phone: '01788888888' },
    { name: 'Monir Khan', email: 'monir@annexleather.com', password: 'Pass@123', role: roles.staff._id, branch: ctg._id, phone: '01799999999' },
  ];

  for (const u of users) {
    const exists = await User.findOne({ email: u.email });
    if (!exists) {
      await User.create(u);
    }
  }
  console.log('  Users seeded');
}

async function seedCategories() {
  const categories = [
    { name: 'Finished Leather', slug: 'finished-leather', description: 'Processed and finished leather goods' },
    { name: 'Raw Hides', slug: 'raw-hides', description: 'Unprocessed animal hides' },
    { name: 'Leather Bags', slug: 'leather-bags', description: 'Bags made from leather' },
    { name: 'Leather Belts', slug: 'leather-belts', description: 'Belts made from leather' },
    { name: 'Leather Wallets', slug: 'leather-wallets', description: 'Wallets and card holders' },
    { name: 'Leather Shoes', slug: 'leather-shoes', description: 'Footwear made from leather' },
    { name: 'Leather Jackets', slug: 'leather-jackets', description: 'Jackets and outerwear' },
    { name: 'Accessories', slug: 'accessories', description: 'Keychains, straps, and other items' },
    { name: 'Chemicals', slug: 'chemicals', description: 'Tanning and processing chemicals' },
    { name: 'Packaging', slug: 'packaging', description: 'Boxes, wraps, and packaging materials' },
  ];
  for (const c of categories) {
    await Category.findOneAndUpdate({ name: c.name }, c, { upsert: true, new: true });
  }
  const bags = await Category.findOne({ name: 'Leather Bags' });
  const subCategories = [
    { name: 'Laptop Bags', slug: 'laptop-bags', description: 'Leather laptop bags', parent: bags._id },
    { name: 'Travel Bags', slug: 'travel-bags', description: 'Leather travel/duffle bags', parent: bags._id },
    { name: 'Handbags', slug: 'handbags', description: 'Leather handbags', parent: bags._id },
  ];
  for (const sc of subCategories) {
    await Category.findOneAndUpdate({ name: sc.name }, sc, { upsert: true, new: true });
  }
  console.log('  Categories seeded');
}

async function seedBrands() {
  const brands = [
    { name: 'Annex Leather', description: 'In-house brand' },
    { name: 'Bengal Hide', description: 'Premium leather products' },
    { name: 'DeshiCraft', description: 'Handcrafted leather goods' },
    { name: 'Royal Leather', description: 'Luxury leather brand' },
    { name: 'TanPro', description: 'Chemical and tanning supplies' },
  ];
  for (const b of brands) {
    await Brand.findOneAndUpdate({ name: b.name }, b, { upsert: true, new: true });
  }
  console.log('  Brands seeded');
}

async function seedUnits() {
  const units = [
    { name: 'Piece', shortName: 'pc' },
    { name: 'Square Foot', shortName: 'sqft' },
    { name: 'Kilogram', shortName: 'kg' },
    { name: 'Meter', shortName: 'm' },
    { name: 'Liter', shortName: 'L' },
    { name: 'Dozen', shortName: 'dz' },
    { name: 'Pair', shortName: 'pr' },
    { name: 'Set', shortName: 'set' },
  ];
  for (const u of units) {
    await Unit.findOneAndUpdate({ shortName: u.shortName }, u, { upsert: true, new: true });
  }
  console.log('  Units seeded');
}

async function seedTaxes() {
  const taxes = [
    { name: 'VAT 15%', rate: 15 },
    { name: 'VAT 7.5%', rate: 7.5 },
    { name: 'VAT 5%', rate: 5 },
    { name: 'Tax Free', rate: 0 },
    { name: 'AIT 5%', rate: 5 },
  ];
  for (const t of taxes) {
    await Tax.findOneAndUpdate({ name: t.name }, t, { upsert: true, new: true });
  }
  console.log('  Taxes seeded');
}

async function seedContacts() {
  const customers = [
    { type: 'customer', name: 'Rafiq Trading', company: 'Rafiq Trading Co.', email: 'rafiq@trading.com', phone: '01811111111', address: 'Gulshan, Dhaka', city: 'Dhaka', country: 'Bangladesh', openingBalance: 0, currentDue: 15000, creditLimit: 100000 },
    { type: 'customer', name: 'Shafiq Enterprise', company: 'Shafiq Enterprise Ltd.', email: 'shafiq@enterprise.com', phone: '01822222222', address: 'Banani, Dhaka', city: 'Dhaka', country: 'Bangladesh', openingBalance: 0, currentDue: 8500, creditLimit: 200000 },
    { type: 'customer', name: 'Export House BD', company: 'Export House BD', email: 'info@exporthousebd.com', phone: '01833333333', address: 'CEPZ, Chittagong', city: 'Chittagong', country: 'Bangladesh', openingBalance: 0, currentDue: 0, creditLimit: 500000 },
    { type: 'customer', name: 'Metro Leather Store', company: 'Metro Leather', email: 'metro@leather.com', phone: '01844444444', address: 'Elephant Road, Dhaka', city: 'Dhaka', country: 'Bangladesh', openingBalance: 5000, currentDue: 22000, creditLimit: 150000 },
    { type: 'customer', name: 'Fashion World', company: 'Fashion World Ltd.', email: 'contact@fashionworld.com', phone: '01855555555', address: 'Dhanmondi, Dhaka', city: 'Dhaka', country: 'Bangladesh', openingBalance: 0, currentDue: 0, creditLimit: 300000 },
    { type: 'customer', name: 'Al-Amin Stores', company: 'Al-Amin Stores', email: 'alamin@stores.com', phone: '01866666666', address: 'Mirpur, Dhaka', city: 'Dhaka', country: 'Bangladesh', openingBalance: 0, currentDue: 4200, creditLimit: 80000 },
  ];
  const suppliers = [
    { type: 'supplier', name: 'Hazaribagh Tannery', company: 'Hazaribagh Tannery Ltd.', email: 'info@hazaritannery.com', phone: '01911111111', address: 'Hazaribagh, Dhaka', city: 'Dhaka', country: 'Bangladesh', openingBalance: 0, currentDue: 45000, creditLimit: 1000000 },
    { type: 'supplier', name: 'Savar Chemicals', company: 'Savar Chemicals Corp.', email: 'sales@savarchemicals.com', phone: '01922222222', address: 'Savar, Dhaka', city: 'Dhaka', country: 'Bangladesh', openingBalance: 0, currentDue: 12000, creditLimit: 300000 },
    { type: 'supplier', name: 'Raw Hide Traders', company: 'Raw Hide Traders', email: 'rawhide@traders.com', phone: '01933333333', address: 'Posta, Dhaka', city: 'Dhaka', country: 'Bangladesh', openingBalance: 0, currentDue: 0, creditLimit: 500000 },
    { type: 'supplier', name: 'PackWell BD', company: 'PackWell BD Ltd.', email: 'info@packwellbd.com', phone: '01944444444', address: 'Tongi, Gazipur', city: 'Gazipur', country: 'Bangladesh', openingBalance: 0, currentDue: 3500, creditLimit: 100000 },
    { type: 'supplier', name: 'Italian Leather Import', company: 'Italian Leather Import Co.', email: 'bd@italianleather.com', phone: '01955555555', address: 'Uttara, Dhaka', city: 'Dhaka', country: 'Bangladesh', openingBalance: 0, currentDue: 120000, creditLimit: 2000000 },
  ];
  for (const c of [...customers, ...suppliers]) {
    await Contact.findOneAndUpdate({ email: c.email }, c, { upsert: true, new: true });
  }
  console.log('  Contacts seeded (6 customers, 5 suppliers)');
}

async function seedProducts() {
  const catBags = await Category.findOne({ name: 'Leather Bags' });
  const catBelts = await Category.findOne({ name: 'Leather Belts' });
  const catWallets = await Category.findOne({ name: 'Leather Wallets' });
  const catShoes = await Category.findOne({ name: 'Leather Shoes' });
  const catJackets = await Category.findOne({ name: 'Leather Jackets' });
  const catFinished = await Category.findOne({ name: 'Finished Leather' });
  const catRaw = await Category.findOne({ name: 'Raw Hides' });
  const catChemicals = await Category.findOne({ name: 'Chemicals' });
  const catAccessories = await Category.findOne({ name: 'Accessories' });
  const catPackaging = await Category.findOne({ name: 'Packaging' });
  const brandAnnex = await Brand.findOne({ name: 'Annex Leather' });
  const brandBengal = await Brand.findOne({ name: 'Bengal Hide' });
  const brandDeshi = await Brand.findOne({ name: 'DeshiCraft' });
  const brandRoyal = await Brand.findOne({ name: 'Royal Leather' });
  const brandTanPro = await Brand.findOne({ name: 'TanPro' });
  const unitPc = await Unit.findOne({ shortName: 'pc' });
  const unitSqft = await Unit.findOne({ shortName: 'sqft' });
  const unitKg = await Unit.findOne({ shortName: 'kg' });
  const unitL = await Unit.findOne({ shortName: 'L' });
  const unitPr = await Unit.findOne({ shortName: 'pr' });
  const unitSet = await Unit.findOne({ shortName: 'set' });
  const vat15 = await Tax.findOne({ name: 'VAT 15%' });
  const vat5 = await Tax.findOne({ name: 'VAT 5%' });
  const taxFree = await Tax.findOne({ name: 'Tax Free' });
  const wh = await Warehouse.findOne({ code: 'WH-MAIN' });

  const products = [
    { name: 'Executive Laptop Bag', sku: 'BAG-LAPTOP-001', type: 'single', category: catBags._id, brand: brandAnnex._id, unit: unitPc._id, tax: vat15._id, purchasePrice: 2200, sellingPrice: 3500, minSellingPrice: 2800, stock: 45, alertQuantity: 10, description: 'Premium full-grain leather laptop bag', warehouse: wh._id },
    { name: 'Classic Travel Duffle', sku: 'BAG-TRAVEL-001', type: 'single', category: catBags._id, brand: brandAnnex._id, unit: unitPc._id, tax: vat15._id, purchasePrice: 3000, sellingPrice: 4800, minSellingPrice: 3800, stock: 22, alertQuantity: 5, description: 'Full-grain leather travel duffle', warehouse: wh._id },
    { name: "Men's Formal Belt", sku: 'BELT-MEN-001', type: 'single', category: catBelts._id, brand: brandBengal._id, unit: unitPc._id, tax: vat15._id, purchasePrice: 350, sellingPrice: 650, minSellingPrice: 500, stock: 140, alertQuantity: 20, description: 'Genuine leather formal belt', warehouse: wh._id },
    { name: 'Bi-Fold Wallet', sku: 'WALLET-BF-001', type: 'single', category: catWallets._id, brand: brandDeshi._id, unit: unitPc._id, tax: vat15._id, purchasePrice: 280, sellingPrice: 550, minSellingPrice: 400, stock: 120, alertQuantity: 25, description: 'Handcrafted bi-fold wallet with RFID', warehouse: wh._id },
    { name: 'Card Holder Slim', sku: 'WALLET-CH-001', type: 'single', category: catWallets._id, brand: brandDeshi._id, unit: unitPc._id, tax: vat15._id, purchasePrice: 150, sellingPrice: 320, minSellingPrice: 220, stock: 85, alertQuantity: 20, description: 'Slim card holder, 6 slots', warehouse: wh._id },
    { name: "Men's Oxford Shoes", sku: 'SHOE-OXF-001', type: 'single', category: catShoes._id, brand: brandRoyal._id, unit: unitPr._id, tax: vat15._id, purchasePrice: 1800, sellingPrice: 3200, minSellingPrice: 2500, stock: 55, alertQuantity: 10, description: 'Full-grain leather oxford shoes', warehouse: wh._id },
    { name: 'Biker Jacket', sku: 'JACKET-BIKER-001', type: 'single', category: catJackets._id, brand: brandAnnex._id, unit: unitPc._id, tax: vat15._id, purchasePrice: 4500, sellingPrice: 7500, minSellingPrice: 6000, stock: 24, alertQuantity: 5, description: 'Classic biker jacket, genuine cowhide', warehouse: wh._id },
    { name: 'Ladies Handbag Premium', sku: 'BAG-HAND-001', type: 'single', category: catBags._id, brand: brandRoyal._id, unit: unitPc._id, tax: vat15._id, purchasePrice: 2800, sellingPrice: 4500, minSellingPrice: 3500, stock: 18, alertQuantity: 5, description: 'Premium ladies handbag, buffalo leather', warehouse: wh._id },
    { name: 'Leather Keychain', sku: 'ACC-KEY-001', type: 'single', category: catAccessories._id, brand: brandDeshi._id, unit: unitPc._id, tax: vat5._id, purchasePrice: 50, sellingPrice: 120, minSellingPrice: 80, stock: 200, alertQuantity: 50, description: 'Handmade leather keychain', warehouse: wh._id },
    { name: 'Executive Gift Set', sku: 'COMBO-GIFT-001', type: 'combo', category: catAccessories._id, brand: brandAnnex._id, unit: unitSet._id, tax: vat15._id, purchasePrice: 800, sellingPrice: 1500, minSellingPrice: 1100, stock: 15, alertQuantity: 5, description: 'Gift set: Wallet + Card Holder + Keychain', warehouse: wh._id },
    { name: 'Cow Hide (Full)', sku: 'RAW-COW-001', type: 'single', category: catRaw._id, unit: unitSqft._id, tax: taxFree._id, purchasePrice: 45, sellingPrice: 65, minSellingPrice: 50, stock: 3500, alertQuantity: 500, description: 'Full cow hide, raw', warehouse: wh._id },
    { name: 'Finished Cow Leather (Black)', sku: 'FIN-COW-BK-001', type: 'single', category: catFinished._id, unit: unitSqft._id, tax: vat5._id, purchasePrice: 120, sellingPrice: 180, minSellingPrice: 145, stock: 1800, alertQuantity: 200, description: 'Finished full-grain cow leather, black', warehouse: wh._id },
    { name: 'Chrome Tanning Agent', sku: 'CHEM-CHROME-001', type: 'single', category: catChemicals._id, brand: brandTanPro._id, unit: unitKg._id, tax: vat5._id, purchasePrice: 180, sellingPrice: 250, minSellingPrice: 200, stock: 500, alertQuantity: 100, description: 'Chrome sulfate for tanning', warehouse: wh._id },
    { name: 'Leather Dye (Black)', sku: 'CHEM-DYE-BK-001', type: 'single', category: catChemicals._id, brand: brandTanPro._id, unit: unitL._id, tax: vat5._id, purchasePrice: 350, sellingPrice: 500, minSellingPrice: 400, stock: 80, alertQuantity: 20, description: 'Premium leather dye, black', warehouse: wh._id },
    { name: 'Gift Box (Medium)', sku: 'PKG-BOX-M-001', type: 'single', category: catPackaging._id, unit: unitPc._id, tax: taxFree._id, purchasePrice: 35, sellingPrice: 60, minSellingPrice: 45, stock: 500, alertQuantity: 100, description: 'Branded gift box, medium', warehouse: wh._id },
    { name: 'Dust Bag', sku: 'PKG-DUST-001', type: 'single', category: catPackaging._id, unit: unitPc._id, tax: taxFree._id, purchasePrice: 15, sellingPrice: 30, minSellingPrice: 20, stock: 1000, alertQuantity: 200, description: 'Cotton dust bag with logo', warehouse: wh._id },
  ];
  for (const p of products) {
    await Product.findOneAndUpdate({ sku: p.sku }, p, { upsert: true, new: true });
  }
  console.log('  Products seeded (16 products)');
}

async function seedBankAccounts() {
  const accounts = [
    { name: 'Cash in Hand', type: 'cash', openingBalance: 250000, currentBalance: 250000, isDefault: true },
    { name: 'Dutch Bangla Bank - Current', accountNumber: '1501020304050', bankName: 'Dutch Bangla Bank', branch: 'Motijheel Branch', type: 'bank', openingBalance: 1500000, currentBalance: 1500000 },
    { name: 'Islami Bank - Savings', accountNumber: '2001030405060', bankName: 'Islami Bank Bangladesh', branch: 'Gulshan Branch', type: 'bank', openingBalance: 800000, currentBalance: 800000 },
    { name: 'bKash Business', accountNumber: '01700000001', bankName: 'bKash', type: 'mobile_banking', openingBalance: 50000, currentBalance: 50000 },
    { name: 'Nagad Business', accountNumber: '01700000001', bankName: 'Nagad', type: 'mobile_banking', openingBalance: 25000, currentBalance: 25000 },
  ];
  for (const a of accounts) {
    await BankAccount.findOneAndUpdate({ name: a.name }, a, { upsert: true, new: true });
  }
  console.log('  Bank Accounts seeded');
}

async function seedLeaveTypes() {
  const leaveTypes = [
    { name: 'Annual Leave', daysAllowed: 15, carryForward: true, maxCarryForwardDays: 5, isPaid: true },
    { name: 'Sick Leave', daysAllowed: 14, carryForward: false, isPaid: true },
    { name: 'Casual Leave', daysAllowed: 10, carryForward: false, isPaid: true },
    { name: 'Maternity Leave', daysAllowed: 112, carryForward: false, isPaid: true },
    { name: 'Paternity Leave', daysAllowed: 7, carryForward: false, isPaid: true },
    { name: 'Unpaid Leave', daysAllowed: 30, carryForward: false, isPaid: false },
  ];
  for (const lt of leaveTypes) {
    await LeaveType.findOneAndUpdate({ name: lt.name }, lt, { upsert: true, new: true });
  }
  console.log('  Leave Types seeded');
}

// ─── NEW: STAFF ─────────────────────────────────────────

async function seedStaff() {
  const users = await User.find({ isDeleted: false }).populate('role');
  const depts = {
    admin: 'Administration', sales_manager: 'Sales & Marketing', purchase_officer: 'Procurement',
    inventory_manager: 'Warehouse', accountant: 'Finance & Accounts', hr_manager: 'Human Resources',
    branch_manager: 'Operations', staff: 'General',
  };
  const desigs = {
    admin: 'System Administrator', sales_manager: 'Sales Manager', purchase_officer: 'Purchase Officer',
    inventory_manager: 'Inventory Manager', accountant: 'Senior Accountant', hr_manager: 'HR Manager',
    branch_manager: 'Branch Manager', staff: 'Staff',
  };
  let idx = 0;
  for (const u of users) {
    if (u.email === 'admin@annexleather.com') continue;
    idx++;
    const roleName = u.role?.name || 'staff';
    const empId = `EMP-${String(idx).padStart(3, '0')}`;
    await Staff.findOneAndUpdate(
      { user: u._id },
      {
        user: u._id,
        employeeId: empId,
        department: depts[roleName] || 'General',
        designation: desigs[roleName] || 'Staff',
        joiningDate: new Date(2024, (idx * 2) % 12, (idx * 5) % 28 + 1),
        basicSalary: [55000, 45000, 42000, 40000, 48000, 50000, 35000, 28000, 25000][idx - 1] || 30000,
        allowances: [12000, 10000, 8000, 7000, 10000, 12000, 8000, 5000, 4000][idx - 1] || 5000,
        deductions: [4000, 3500, 3000, 2500, 3500, 4000, 3000, 2000, 1500][idx - 1] || 2000,
        isActive: true,
      },
      { upsert: true, new: true }
    );
  }
  console.log('  Staff seeded');
}

// ─── NEW: HOLIDAYS ──────────────────────────────────────

async function seedHolidays() {
  const holidays = [
    { name: 'International Mother Language Day', date: new Date(2026, 1, 21), isRecurring: true },
    { name: 'Independence Day', date: new Date(2026, 2, 26), isRecurring: true },
    { name: 'Bengali New Year (Pohela Boishakh)', date: new Date(2026, 3, 14), isRecurring: true },
    { name: 'May Day', date: new Date(2026, 4, 1), isRecurring: true },
    { name: 'Shab-e-Qadr', date: new Date(2026, 2, 13) },
    { name: 'Eid-ul-Fitr', date: new Date(2026, 2, 15) },
    { name: 'Eid-ul-Adha', date: new Date(2026, 5, 22) },
    { name: 'Victory Day', date: new Date(2026, 11, 16), isRecurring: true },
  ];
  await Holiday.deleteMany({});
  await Holiday.insertMany(holidays);
  console.log('  Holidays seeded');
}

// ─── NEW: SALES ─────────────────────────────────────────

async function seedSales() {
  const existingSales = await Sale.countDocuments();
  if (existingSales > 0) { console.log('  Sales already exist, skipping'); return; }

  const customers = await Contact.find({ type: 'customer' });
  const products = await Product.find({ type: 'single', sellingPrice: { $gte: 100 } }).limit(8);
  const admin = await User.findOne({ email: 'admin@annexleather.com' });
  const ho = await Branch.findOne({ code: 'HO' });
  const wh = await Warehouse.findOne({ code: 'WH-MAIN' });

  const salesData = [];
  for (let i = 0; i < 5; i++) {
    const customer = customers[i % customers.length];
    const prod1 = products[i % products.length];
    const prod2 = products[(i + 1) % products.length];
    const qty1 = Math.floor(Math.random() * 5) + 1;
    const qty2 = Math.floor(Math.random() * 3) + 1;
    const sub1 = qty1 * prod1.sellingPrice;
    const sub2 = qty2 * prod2.sellingPrice;
    const subtotal = sub1 + sub2;
    const tax = Math.round(subtotal * 0.15);
    const grandTotal = subtotal + tax;
    const paid = i < 3 ? grandTotal : Math.round(grandTotal * 0.5);

    salesData.push({
      invoiceNo: `INV-${String(i + 1).padStart(3, '0')}`,
      customer: customer._id,
      saleDate: new Date(2026, 2, 15 + i),
      items: [
        { product: prod1._id, name: prod1.name, sku: prod1.sku, quantity: qty1, unitPrice: prod1.sellingPrice, discount: 0, tax: 0, subtotal: sub1 },
        { product: prod2._id, name: prod2.name, sku: prod2.sku, quantity: qty2, unitPrice: prod2.sellingPrice, discount: 0, tax: 0, subtotal: sub2 },
      ],
      subtotal,
      taxAmount: tax,
      grandTotal,
      payments: [{ amount: paid, method: 'cash', date: new Date(2026, 2, 15 + i) }],
      paidAmount: paid,
      dueAmount: grandTotal - paid,
      paymentStatus: paid >= grandTotal ? 'paid' : 'partial',
      status: 'confirmed',
      createdBy: admin._id,
      branch: ho._id,
      warehouse: wh._id,
    });
  }
  await Sale.insertMany(salesData);
  console.log('  Sales seeded (5 invoices)');
}

// ─── NEW: PURCHASES ─────────────────────────────────────

async function seedPurchases() {
  const existing = await Purchase.countDocuments();
  if (existing > 0) { console.log('  Purchases already exist, skipping'); return; }

  const suppliers = await Contact.find({ type: 'supplier' });
  const products = await Product.find({ type: 'single', purchasePrice: { $gte: 30 } }).limit(6);
  const admin = await User.findOne({ email: 'admin@annexleather.com' });
  const wh = await Warehouse.findOne({ code: 'WH-MAIN' });

  const purchasesData = [];
  for (let i = 0; i < 4; i++) {
    const supplier = suppliers[i % suppliers.length];
    const prod = products[i % products.length];
    const qty = (Math.floor(Math.random() * 10) + 5) * 10;
    const subtotal = qty * prod.purchasePrice;
    const tax = Math.round(subtotal * 0.05);
    const grandTotal = subtotal + tax;
    const paid = i < 2 ? grandTotal : Math.round(grandTotal * 0.6);

    purchasesData.push({
      referenceNo: `PO-${String(i + 1).padStart(3, '0')}`,
      supplier: supplier._id,
      purchaseDate: new Date(2026, 2, 10 + i * 3),
      items: [
        { product: prod._id, name: prod.name, sku: prod.sku, quantity: qty, unitPrice: prod.purchasePrice, discount: 0, tax: 0, subtotal },
      ],
      subtotal,
      taxAmount: tax,
      grandTotal,
      payments: [{ amount: paid, method: 'bank', date: new Date(2026, 2, 10 + i * 3) }],
      paidAmount: paid,
      dueAmount: grandTotal - paid,
      paymentStatus: paid >= grandTotal ? 'paid' : 'partial',
      status: i < 3 ? 'received' : 'ordered',
      createdBy: admin._id,
      warehouse: wh._id,
    });
  }
  await Purchase.insertMany(purchasesData);
  console.log('  Purchases seeded (4 orders)');
}

// ─── NEW: TRANSACTIONS ──────────────────────────────────

async function seedTransactions() {
  const existing = await Transaction.countDocuments();
  if (existing > 0) { console.log('  Transactions already exist, skipping'); return; }

  const bank = await BankAccount.findOne({ bankName: 'Dutch Bangla Bank' });
  const cash = await BankAccount.findOne({ name: 'Cash in Hand' });
  const admin = await User.findOne({ email: 'admin@annexleather.com' });

  const txns = [
    { type: 'income', category: 'Product Sales', amount: 245000, account: bank._id, date: new Date(2026, 2, 15), description: 'March product sales revenue', createdBy: admin._id },
    { type: 'income', category: 'Service Income', amount: 35000, account: bank._id, date: new Date(2026, 2, 18), description: 'Leather finishing service', createdBy: admin._id },
    { type: 'expense', category: 'Rent', amount: 85000, account: bank._id, date: new Date(2026, 2, 1), description: 'Office rent - March', createdBy: admin._id },
    { type: 'expense', category: 'Utilities', amount: 12500, account: bank._id, date: new Date(2026, 2, 5), description: 'Electricity + water bill', createdBy: admin._id },
    { type: 'expense', category: 'Salaries', amount: 420000, account: bank._id, date: new Date(2026, 2, 28), description: 'March staff salaries', createdBy: admin._id },
    { type: 'expense', category: 'Marketing', amount: 15000, account: cash._id, date: new Date(2026, 2, 10), description: 'Facebook ads + catalogue', createdBy: admin._id },
    { type: 'income', category: 'Other Income', amount: 8000, account: cash._id, date: new Date(2026, 2, 20), description: 'Scrap leather sold', createdBy: admin._id },
    { type: 'expense', category: 'Office Supplies', amount: 5500, account: cash._id, date: new Date(2026, 2, 12), description: 'Stationery and printer supplies', createdBy: admin._id },
  ];
  await Transaction.insertMany(txns);
  console.log('  Transactions seeded (8 records)');
}

// ─── NEW: ATTENDANCE ────────────────────────────────────

async function seedAttendance() {
  const existing = await Attendance.countDocuments();
  if (existing > 0) { console.log('  Attendance already exist, skipping'); return; }

  const staffList = await Staff.find({ isActive: true });
  const records = [];
  // Last 5 working days
  for (let d = 0; d < 5; d++) {
    const date = new Date(2026, 3, 1 + d); // April 1-5, 2026
    for (const s of staffList) {
      const rand = Math.random();
      let status = 'present', checkIn = '09:00', checkOut = '18:00';
      if (rand > 0.9) { status = 'absent'; checkIn = ''; checkOut = ''; }
      else if (rand > 0.8) { status = 'late'; checkIn = '09:45'; }
      records.push({ staff: s._id, date, status, checkIn, checkOut });
    }
  }
  await Attendance.insertMany(records);
  console.log('  Attendance seeded (5 days)');
}

// ─── NEW: NOTIFICATIONS ─────────────────────────────────

async function seedNotifications() {
  await Notification.deleteMany({});
  const admin = await User.findOne({ email: 'admin@annexleather.com' });

  const notifications = [
    { user: admin._id, title: 'New Sale Created', message: 'Invoice INV-001 created for Rafiq Trading - ৳45,500', type: 'success', module: 'sales', link: '/sales' },
    { user: admin._id, title: 'Low Stock Alert', message: 'Executive Laptop Bag stock is below alert quantity (10 remaining)', type: 'warning', module: 'inventory', link: '/inventory' },
    { user: admin._id, title: 'Payment Received', message: 'Received ৳15,000 from Shafiq Enterprise against INV-003', type: 'info', module: 'accounts', link: '/accounts/transactions' },
    { user: admin._id, title: 'Leave Request', message: 'Babul Mia has applied for Annual Leave (5 days)', type: 'info', module: 'leave', link: '/leave/pending' },
    { user: admin._id, title: 'Purchase Order Due', message: 'PO-003 from Raw Hide Traders is due for payment tomorrow', type: 'warning', module: 'purchase', link: '/purchase' },
    { user: admin._id, title: 'New Staff Added', message: 'Monir Khan has been added as Staff at Chittagong Branch', type: 'success', module: 'hrm', link: '/hrm' },
    { user: admin._id, title: 'System Maintenance', message: 'Scheduled maintenance on April 10, 2026 from 2:00 AM to 4:00 AM', type: 'system', module: '', link: '' },
    { user: admin._id, title: 'Monthly Report Ready', message: 'March 2026 Profit & Loss report is ready for review', type: 'info', module: 'accounts', link: '/accounts/profit-loss' },
  ];
  await Notification.insertMany(notifications);
  console.log('  Notifications seeded (8 notifications)');
}

// ─── NEW: MANUFACTURING ────────────────────────────────

async function seedManufacturing() {
  const existingBOMs = await BOM.countDocuments();
  if (existingBOMs > 0) { console.log('  Manufacturing data already exists, skipping'); return; }

  const admin = await User.findOne({ email: 'admin@annexleather.com' });
  const laptopBag = await Product.findOne({ sku: 'BAG-LAPTOP-001' });
  const belt = await Product.findOne({ sku: 'BELT-MEN-001' });
  const wallet = await Product.findOne({ sku: 'WALLET-BF-001' });
  const jacket = await Product.findOne({ sku: 'JACKET-BIKER-001' });
  const shoes = await Product.findOne({ sku: 'SHOE-OXF-001' });

  // 5 BOMs
  const bomsData = [
    {
      name: 'Executive Laptop Bag BOM',
      product: laptopBag._id,
      version: 'v1.0',
      materials: [
        { name: 'Full-Grain Cow Leather', quantity: 12, unit: 'sqft', unitCost: 180, totalCost: 2160 },
        { name: 'YKK Zipper (18 inch)', quantity: 2, unit: 'pc', unitCost: 45, totalCost: 90 },
        { name: 'Nylon Lining', quantity: 3, unit: 'sqft', unitCost: 25, totalCost: 75 },
        { name: 'Metal Buckle', quantity: 2, unit: 'pc', unitCost: 30, totalCost: 60 },
        { name: 'Thread (Heavy Duty)', quantity: 1, unit: 'pc', unitCost: 15, totalCost: 15 },
      ],
      operations: [
        { name: 'Cutting', description: 'Cut leather panels per pattern', duration: 30, cost: 50 },
        { name: 'Stitching', description: 'Assemble panels and lining', duration: 90, cost: 150 },
        { name: 'Finishing', description: 'Edge finishing and polishing', duration: 20, cost: 30 },
        { name: 'QC & Packing', description: 'Quality check and packaging', duration: 15, cost: 20 },
      ],
      materialCost: 2400,
      operationCost: 250,
      totalCost: 2650,
      status: 'active',
    },
    {
      name: "Men's Formal Belt BOM",
      product: belt._id,
      version: 'v1.0',
      materials: [
        { name: 'Belt Strip Leather', quantity: 3, unit: 'sqft', unitCost: 120, totalCost: 360 },
        { name: 'Metal Buckle (Nickel)', quantity: 1, unit: 'pc', unitCost: 35, totalCost: 35 },
        { name: 'Edge Paint', quantity: 0.1, unit: 'L', unitCost: 500, totalCost: 50 },
      ],
      operations: [
        { name: 'Cutting & Skiving', description: 'Cut strip and skive edges', duration: 15, cost: 20 },
        { name: 'Punching & Stitching', description: 'Punch holes and stitch', duration: 20, cost: 30 },
        { name: 'Edge Finishing', description: 'Paint edges and polish', duration: 10, cost: 15 },
      ],
      materialCost: 445,
      operationCost: 65,
      totalCost: 510,
      status: 'active',
    },
    {
      name: 'Bi-Fold Wallet BOM',
      product: wallet._id,
      version: 'v1.0',
      materials: [
        { name: 'Calf Leather', quantity: 2, unit: 'sqft', unitCost: 150, totalCost: 300 },
        { name: 'Card Slot Leather', quantity: 1.5, unit: 'sqft', unitCost: 100, totalCost: 150 },
        { name: 'RFID Blocking Film', quantity: 1, unit: 'pc', unitCost: 20, totalCost: 20 },
        { name: 'Thread (Fine)', quantity: 1, unit: 'pc', unitCost: 10, totalCost: 10 },
      ],
      operations: [
        { name: 'Cutting', description: 'Cut wallet panels', duration: 10, cost: 15 },
        { name: 'Assembly', description: 'Assemble card slots and fold', duration: 40, cost: 60 },
        { name: 'Edge & QC', description: 'Edge paint and quality check', duration: 15, cost: 20 },
      ],
      materialCost: 480,
      operationCost: 95,
      totalCost: 575,
      status: 'active',
    },
    {
      name: 'Biker Jacket BOM',
      product: jacket._id,
      version: 'v2.0',
      materials: [
        { name: 'Cowhide Leather', quantity: 25, unit: 'sqft', unitCost: 180, totalCost: 4500 },
        { name: 'Heavy Duty Zipper', quantity: 5, unit: 'pc', unitCost: 60, totalCost: 300 },
        { name: 'Quilted Lining', quantity: 8, unit: 'sqft', unitCost: 40, totalCost: 320 },
        { name: 'Snap Buttons', quantity: 8, unit: 'pc', unitCost: 10, totalCost: 80 },
        { name: 'Thread (Heavy Duty)', quantity: 3, unit: 'pc', unitCost: 15, totalCost: 45 },
      ],
      operations: [
        { name: 'Pattern & Cutting', description: 'Pattern layout and cutting', duration: 60, cost: 100 },
        { name: 'Stitching', description: 'Panel assembly and stitching', duration: 180, cost: 300 },
        { name: 'Zipper & Hardware', description: 'Install zippers and snaps', duration: 45, cost: 75 },
        { name: 'Finishing & QC', description: 'Final finishing and inspection', duration: 30, cost: 50 },
      ],
      materialCost: 5245,
      operationCost: 525,
      totalCost: 5770,
      status: 'active',
    },
    {
      name: "Men's Oxford Shoes BOM",
      product: shoes._id,
      version: 'v1.0',
      materials: [
        { name: 'Upper Leather', quantity: 4, unit: 'sqft', unitCost: 200, totalCost: 800 },
        { name: 'Sole (Leather)', quantity: 1, unit: 'pr', unitCost: 250, totalCost: 250 },
        { name: 'Insole', quantity: 1, unit: 'pr', unitCost: 80, totalCost: 80 },
        { name: 'Lining Leather', quantity: 2, unit: 'sqft', unitCost: 100, totalCost: 200 },
        { name: 'Shoelaces', quantity: 1, unit: 'pr', unitCost: 15, totalCost: 15 },
        { name: 'Shoe Polish', quantity: 0.05, unit: 'L', unitCost: 400, totalCost: 20 },
      ],
      operations: [
        { name: 'Clicking (Cutting)', description: 'Cut upper pieces', duration: 30, cost: 50 },
        { name: 'Closing (Stitching)', description: 'Stitch upper components', duration: 60, cost: 100 },
        { name: 'Lasting', description: 'Shape on last and attach sole', duration: 45, cost: 80 },
        { name: 'Finishing', description: 'Polish and final inspection', duration: 20, cost: 40 },
      ],
      materialCost: 1365,
      operationCost: 270,
      totalCost: 1635,
      status: 'draft',
    },
  ];
  await BOM.insertMany(bomsData);

  // 3 Production Plans
  const plansData = [
    {
      planCode: 'PP-001',
      product: laptopBag._id,
      quantity: 100,
      startDate: new Date(2026, 3, 10),
      endDate: new Date(2026, 3, 25),
      resources: '5 cutting machines, 10 stitching machines, 25 workers',
      materialStatus: 'available',
      progress: 45,
      status: 'in_progress',
      notes: 'Bulk order for Export House BD',
      createdBy: admin._id,
    },
    {
      planCode: 'PP-002',
      product: jacket._id,
      quantity: 50,
      startDate: new Date(2026, 4, 1),
      endDate: new Date(2026, 4, 20),
      resources: '3 cutting machines, 8 stitching machines, 20 workers',
      materialStatus: 'partial',
      progress: 0,
      status: 'scheduled',
      notes: 'Winter collection preparation',
      createdBy: admin._id,
    },
    {
      planCode: 'PP-003',
      product: wallet._id,
      quantity: 200,
      startDate: new Date(2026, 2, 1),
      endDate: new Date(2026, 2, 15),
      resources: '2 cutting machines, 6 stitching machines, 15 workers',
      materialStatus: 'available',
      progress: 100,
      status: 'completed',
      notes: 'Eid gift season stock',
      createdBy: admin._id,
    },
  ];
  const plans = await ProductionPlan.insertMany(plansData);

  // 7 Work Orders
  const workOrdersData = [
    {
      orderCode: 'WO-001',
      product: laptopBag._id,
      productionPlan: plans[0]._id,
      quantity: 30,
      orderDate: new Date(2026, 3, 10),
      dueDate: new Date(2026, 3, 15),
      priority: 'high',
      assignedTo: 'Line A - Cutting Section',
      status: 'completed',
      notes: 'First batch for Export House BD order',
      createdBy: admin._id,
    },
    {
      orderCode: 'WO-002',
      product: laptopBag._id,
      productionPlan: plans[0]._id,
      quantity: 35,
      orderDate: new Date(2026, 3, 14),
      dueDate: new Date(2026, 3, 20),
      priority: 'high',
      assignedTo: 'Line A - Stitching Section',
      status: 'in_progress',
      notes: 'Second batch - stitching in progress',
      createdBy: admin._id,
    },
    {
      orderCode: 'WO-003',
      product: laptopBag._id,
      productionPlan: plans[0]._id,
      quantity: 35,
      orderDate: new Date(2026, 3, 18),
      dueDate: new Date(2026, 3, 25),
      priority: 'medium',
      assignedTo: 'Line B',
      status: 'pending',
      notes: 'Third batch - awaiting materials from batch 2 completion',
      createdBy: admin._id,
    },
    {
      orderCode: 'WO-004',
      product: jacket._id,
      productionPlan: plans[1]._id,
      quantity: 25,
      orderDate: new Date(2026, 4, 1),
      dueDate: new Date(2026, 4, 10),
      priority: 'medium',
      assignedTo: 'Line C - Jacket Unit',
      status: 'pending',
      notes: 'First batch of winter jackets',
      createdBy: admin._id,
    },
    {
      orderCode: 'WO-005',
      product: jacket._id,
      productionPlan: plans[1]._id,
      quantity: 25,
      orderDate: new Date(2026, 4, 8),
      dueDate: new Date(2026, 4, 20),
      priority: 'low',
      assignedTo: 'Line C - Jacket Unit',
      status: 'pending',
      notes: 'Second batch of winter jackets',
      createdBy: admin._id,
    },
    {
      orderCode: 'WO-006',
      product: belt._id,
      quantity: 50,
      orderDate: new Date(2026, 3, 5),
      dueDate: new Date(2026, 3, 12),
      priority: 'medium',
      assignedTo: 'Line D - Small Goods',
      status: 'shipping',
      notes: 'Belt order for Metro Leather Store',
      createdBy: admin._id,
    },
    {
      orderCode: 'WO-007',
      product: shoes._id,
      quantity: 20,
      orderDate: new Date(2026, 3, 1),
      dueDate: new Date(2026, 3, 8),
      priority: 'high',
      assignedTo: 'Shoe Unit',
      status: 'cancelled',
      notes: 'Cancelled - customer withdrew order',
      createdBy: admin._id,
    },
  ];
  await WorkOrder.insertMany(workOrdersData);

  // 6 Subcontracting Items
  const suppliers = await Contact.find({ type: 'supplier' });
  const subItemsData = [
    { name: 'Sole Attachment', category: 'Assembly', processType: 'Cementing', supplier: suppliers[0]._id, unitCost: 120 },
    { name: 'Metal Buckle Plating', category: 'Finishing', processType: 'Nickel Plating', supplier: suppliers[1]._id, unitCost: 25 },
    { name: 'Leather Embossing', category: 'Finishing', processType: 'Hot Stamping', supplier: suppliers[2]._id, unitCost: 35 },
    { name: 'Zipper Assembly', category: 'Assembly', processType: 'Sewing', supplier: suppliers[0]._id, unitCost: 40 },
    { name: 'Edge Painting', category: 'Finishing', processType: 'Hand Painting', supplier: suppliers[3]._id, unitCost: 15 },
    { name: 'Quilted Lining Stitch', category: 'Fitting', processType: 'Machine Quilting', supplier: suppliers[1]._id, unitCost: 55 },
  ];
  const subItems = await SubcontractingItem.insertMany(subItemsData);

  // 4 Subcontracting Orders
  const subOrdersData = [
    {
      orderCode: 'SCO-001',
      supplier: suppliers[0]._id,
      items: [
        { item: subItems[0]._id, quantity: 100, unitCost: 120, totalCost: 12000 },
        { item: subItems[3]._id, quantity: 100, unitCost: 40, totalCost: 4000 },
      ],
      totalAmount: 16000,
      orderDate: new Date(2026, 3, 5),
      dueDate: new Date(2026, 3, 15),
      status: 'in_progress',
      paidAmount: 8000,
      dueAmount: 8000,
      notes: 'Sole and zipper work for laptop bag order',
      createdBy: admin._id,
    },
    {
      orderCode: 'SCO-002',
      supplier: suppliers[1]._id,
      items: [
        { item: subItems[1]._id, quantity: 200, unitCost: 25, totalCost: 5000 },
        { item: subItems[5]._id, quantity: 50, unitCost: 55, totalCost: 2750 },
      ],
      totalAmount: 7750,
      orderDate: new Date(2026, 3, 8),
      dueDate: new Date(2026, 3, 18),
      status: 'pending',
      paidAmount: 0,
      dueAmount: 7750,
      notes: 'Buckle plating for belts and lining for jackets',
      createdBy: admin._id,
    },
    {
      orderCode: 'SCO-003',
      supplier: suppliers[2]._id,
      items: [
        { item: subItems[2]._id, quantity: 150, unitCost: 35, totalCost: 5250 },
      ],
      totalAmount: 5250,
      orderDate: new Date(2026, 2, 20),
      dueDate: new Date(2026, 2, 28),
      status: 'completed',
      paidAmount: 5250,
      dueAmount: 0,
      notes: 'Embossing for wallet batch',
      createdBy: admin._id,
    },
    {
      orderCode: 'SCO-004',
      supplier: suppliers[3]._id,
      items: [
        { item: subItems[4]._id, quantity: 300, unitCost: 15, totalCost: 4500 },
      ],
      totalAmount: 4500,
      orderDate: new Date(2026, 3, 12),
      dueDate: new Date(2026, 3, 22),
      status: 'pending',
      paidAmount: 2000,
      dueAmount: 2500,
      notes: 'Edge painting for belts and wallets',
      createdBy: admin._id,
    },
  ];
  await SubcontractingOrder.insertMany(subOrdersData);

  console.log('  Manufacturing seeded (5 BOMs, 3 Plans, 7 Work Orders, 6 Sub Items, 4 Sub Orders)');
}

// ─── MAIN ───────────────────────────────────────────────

const seed = async () => {
  try {
    await connectDB();
    console.log('\nSeeding Annex Leather ERP...\n');

    await seedRoles();
    await seedBranches();
    await seedWarehouses();
    await seedUsers();
    await seedCategories();
    await seedBrands();
    await seedUnits();
    await seedTaxes();
    await seedContacts();
    await seedProducts();
    await seedBankAccounts();
    await seedLeaveTypes();
    await seedStaff();
    await seedHolidays();
    await seedSales();
    await seedPurchases();
    await seedTransactions();
    await seedAttendance();
    await seedNotifications();
    await seedManufacturing();

    console.log('\nSeed complete!\n');
    console.log('Login credentials:');
    console.log('──────────────────────────────────────────');
    console.log('Super Admin : admin@annexleather.com / Admin@123');
    console.log('Admin       : rahim@annexleather.com / Pass@123');
    console.log('Sales Mgr   : karim@annexleather.com / Pass@123');
    console.log('Purchase    : jamal@annexleather.com / Pass@123');
    console.log('Inventory   : sumon@annexleather.com / Pass@123');
    console.log('Accountant  : nasrin@annexleather.com / Pass@123');
    console.log('HR Manager  : fatema@annexleather.com / Pass@123');
    console.log('Branch Mgr  : anwar@annexleather.com / Pass@123');
    console.log('Staff       : babul@annexleather.com / Pass@123');
    console.log('Staff       : monir@annexleather.com / Pass@123');
    console.log('──────────────────────────────────────────\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seed();

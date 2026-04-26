import { PrismaClient, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { allPermissions } from '../src/lib/permissions';

const prisma = new PrismaClient();

const SYSTEM_ROLES: Array<{ name: string; description: string; permissions: 'ALL' | string[] }> = [
  { name: 'Super Admin', description: 'Full system access', permissions: 'ALL' },
  {
    name: 'Admin',
    description: 'Branch-level admin',
    permissions: [
      'dashboard:read',
      'users:read',
      'users:write',
      'branches:read',
      'approvals:read',
      'approvals:approve',
      'approvals:reject',
      'audit:read',
      'notifications:read',
      'inventory:read',
      'warehouse:read',
      'suppliers:read',
      'suppliers:write',
      'purchase:read',
      'purchase:write',
      'purchase:approve',
      'purchase:receive',
      'purchase:invoice',
      'purchase:pay',
      'accounts:read',
      'reports:read',
      'reports:export',
      'crm:read',
      'crm:write',
      'wholesale:read',
      'wholesale:write',
      'wholesale:payment',
      'wholesale:return',
      'wholesale:void',
      'wholesale:discount-override',
      'corporate-sales:read',
      'corporate-sales:quote',
      'corporate-sales:order',
      'corporate-sales:deliver',
      'corporate-sales:invoice',
      'corporate-sales:payment',
      'corporate-sales:cancel',
      'corporate-sales:discount-override',
    ],
  },
  {
    name: 'Accountant',
    description: 'Finance operations',
    permissions: [
      'dashboard:read',
      'accounts:read',
      'accounts:post',
      'accounts:void',
      'coa:read',
      'coa:write',
      'suppliers:read',
      'purchase:read',
      'purchase:invoice',
      'purchase:pay',
      'reports:read',
      'reports:export',
      'audit:read',
      'notifications:read',
    ],
  },
  {
    name: 'Purchase Manager',
    description: 'Procurement operations',
    permissions: [
      'dashboard:read',
      'suppliers:read',
      'suppliers:write',
      'suppliers:delete',
      'purchase:read',
      'purchase:write',
      'purchase:approve',
      'purchase:receive',
      'purchase:invoice',
      'purchase:pay',
      'inventory:read',
      'warehouse:read',
      'warehouse:receive',
      'notifications:read',
      'approvals:read',
    ],
  },
  {
    name: 'Warehouse Operator',
    description: 'Goods in / out, transfers, counts',
    permissions: [
      'dashboard:read',
      'inventory:read',
      'warehouse:read',
      'warehouse:receive',
      'warehouse:issue',
      'warehouse:transfer',
      'warehouse:count',
      'suppliers:read',
      'purchase:read',
      'purchase:receive',
      'barcode:read',
      'barcode:print',
      'notifications:read',
    ],
  },
  {
    name: 'Cashier',
    description: 'POS operations',
    permissions: [
      'dashboard:read',
      'pos:sell',
      'pos:refund',
      'pos:close-session',
      'barcode:read',
      'notifications:read',
    ],
  },
  {
    name: 'Sales Rep',
    description: 'Wholesale invoicing, CRM, and customer follow-up',
    permissions: [
      'dashboard:read',
      'crm:read',
      'crm:write',
      'wholesale:read',
      'wholesale:write',
      'wholesale:payment',
      'wholesale:return',
      'corporate-sales:read',
      'corporate-sales:quote',
      'corporate-sales:order',
      'corporate-sales:deliver',
      'corporate-sales:invoice',
      'corporate-sales:payment',
      'inventory:read',
      'barcode:read',
      'notifications:read',
    ],
  },
  {
    name: 'Factory Manager',
    description: 'Production operations',
    permissions: [
      'dashboard:read',
      'factory:read',
      'factory:plan',
      'factory:execute',
      'factory:close',
      'inventory:read',
      'warehouse:read',
      'notifications:read',
    ],
  },
  {
    name: 'HR Manager',
    description: 'HR and payroll operations',
    permissions: [
      'dashboard:read',
      'hr:read',
      'hr:write',
      'hr:attendance',
      'hr:leave-approve',
      'hr:process-payroll',
      'hr:approve-payroll',
      'hr:pay-payroll',
      'hr:lock-payroll',
      'notifications:read',
    ],
  },
];

// Sample users with different roles
const SAMPLE_USERS = [
  { email: 'admin@annex.local', name: 'Admin User', role: 'Super Admin', branch: 'HQ' },
  { email: 'accountant@annex.local', name: 'Rahim Ahmed', role: 'Accountant', branch: 'HQ' },
  { email: 'purchase@annex.local', name: 'Karim Hassan', role: 'Purchase Manager', branch: 'HQ' },
  { email: 'warehouse@annex.local', name: 'Ali Miah', role: 'Warehouse Operator', branch: 'HQ' },
  { email: 'cashier@annex.local', name: 'Salman Khan', role: 'Cashier', branch: 'HQ' },
  { email: 'sales@annex.local', name: 'Rashid Chowdhury', role: 'Sales Rep', branch: 'HQ' },
  { email: 'factory@annex.local', name: 'Jahid Hasan', role: 'Factory Manager', branch: 'Factory' },
  { email: 'hr@annex.local', name: 'Nadia Begum', role: 'HR Manager', branch: 'HQ' },
];

// Additional branches
const ADDITIONAL_BRANCHES = [
  { code: 'DHAKA', name: 'Dhaka Showroom', type: 'SHOWROOM', currency: 'BDT' as const },
  { code: 'CTG', name: 'Chittagong Warehouse', type: 'WAREHOUSE', currency: 'BDT' as const },
  { code: 'FACTORY', name: 'Production Factory', type: 'FACTORY', currency: 'BDT' as const },
  { code: 'INDIA', name: 'India Operations', type: 'MAIN', currency: 'INR' as const },
];

// Product categories
const PRODUCT_CATEGORIES = [
  'Finished Leather',
  'Raw Hides',
  'Synthetic Leather',
  'Chemicals',
  'Accessories',
  'Packaging',
  ' machinery',
  'Tools',
  'Stationery',
];

// Product brands
const PRODUCT_BRANDS = ['Annex', 'Premium Leathers', 'Imported', 'Generic', 'Local'];

// Sample products
const SAMPLE_PRODUCTS = [
  // Finished Leather
  { sku: 'FL-001', name: 'Black Cowhide Leather', type: 'FINISHED_GOOD' as const, costPrice: 2500, sellPrice: 3500 },
  { sku: 'FL-002', name: 'Brown Cowhide Leather', type: 'FINISHED_GOOD' as const, costPrice: 2400, sellPrice: 3400 },
  { sku: 'FL-003', name: 'Tan Goat Leather', type: 'FINISHED_GOOD' as const, costPrice: 1800, sellPrice: 2500 },
  { sku: 'FL-004', name: 'Red Buffalo Leather', type: 'FINISHED_GOOD' as const, costPrice: 2800, sellPrice: 3800 },
  { sku: 'FL-005', name: 'Navy Blue Sheep Leather', type: 'FINISHED_GOOD' as const, costPrice: 2200, sellPrice: 3000 },
  // Raw Hides
  { sku: 'RH-001', name: 'Raw Cow Hide (Wet Blue)', type: 'RAW_MATERIAL' as const, costPrice: 800, sellPrice: 1200 },
  { sku: 'RH-002', name: 'Raw Goat Skin', type: 'RAW_MATERIAL' as const, costPrice: 400, sellPrice: 600 },
  { sku: 'RH-003', name: 'Raw Buffalo Hide', type: 'RAW_MATERIAL' as const, costPrice: 1000, sellPrice: 1500 },
  // Chemicals
  { sku: 'CH-001', name: 'Leather Finish 1L', type: 'CONSUMABLE' as const, costPrice: 450, sellPrice: 650 },
  { sku: 'CH-002', name: 'Dye Solution 1L', type: 'CONSUMABLE' as const, costPrice: 350, sellPrice: 500 },
  { sku: 'CH-003', name: 'Wax Polish 500ml', type: 'CONSUMABLE' as const, costPrice: 200, sellPrice: 300 },
  { sku: 'CH-004', name: 'Edge Paint 1L', type: 'CONSUMABLE' as const, costPrice: 550, sellPrice: 750 },
  // Accessories
  { sku: 'AC-001', name: 'Brass Buckle 25mm', type: 'CONSUMABLE' as const, costPrice: 25, sellPrice: 40 },
  { sku: 'AC-002', name: 'Metal Zipper 60cm', type: 'CONSUMABLE' as const, costPrice: 45, sellPrice: 70 },
  { sku: 'AC-003', name: 'Leather Cord 100m', type: 'CONSUMABLE' as const, costPrice: 150, sellPrice: 220 },
  { sku: 'AC-004', name: 'Needle Set (100 pcs)', type: 'CONSUMABLE' as const, costPrice: 80, sellPrice: 120 },
  { sku: 'AC-005', name: 'Thread Spool (Black)', type: 'CONSUMABLE' as const, costPrice: 30, sellPrice: 50 },
  // Packaging
  { sku: 'PK-001', name: 'Paper Bag (Medium)', type: 'CONSUMABLE' as const, costPrice: 15, sellPrice: 25 },
  { sku: 'PK-002', name: 'Carton Box (Large)', type: 'CONSUMABLE' as const, costPrice: 80, sellPrice: 120 },
  { sku: 'PK-003', name: 'Bubble Wrap Roll', type: 'CONSUMABLE' as const, costPrice: 350, sellPrice: 450 },
  // Machinery
  { sku: 'MA-001', name: 'Industrial Sewing Machine', type: 'FINISHED_GOOD' as const, costPrice: 45000, sellPrice: 65000 },
  { sku: 'MA-002', name: 'Leather Splitting Machine', type: 'FINISHED_GOOD' as const, costPrice: 85000, sellPrice: 120000 },
  // Tools
  { sku: 'TL-001', name: 'Leather Cutting Knife', type: 'CONSUMABLE' as const, costPrice: 150, sellPrice: 250 },
  { sku: 'TL-002', name: 'Edge Trimming Tool', type: 'CONSUMABLE' as const, costPrice: 200, sellPrice: 320 },
  { sku: 'TL-003', name: 'Mallet (Wooden)', type: 'CONSUMABLE' as const, costPrice: 180, sellPrice: 280 },
];

// Suppliers
const SAMPLE_SUPPLIERS = [
  { code: 'SUP-001', name: 'Tanveer Hides & Skins', contactPerson: 'Tanveer Ahmed', city: 'Dhaka', paymentTerms: 'NET_30' as const },
  { code: 'SUP-002', name: 'Chittagong Leather Co.', contactPerson: 'Khalil Miya', city: 'Chittagong', paymentTerms: 'NET_45' as const },
  { code: 'SUP-003', name: 'India Leather Imports', contactPerson: 'Rajesh Kumar', city: 'Kolkata', paymentTerms: 'NET_60' as const },
  { code: 'SUP-004', name: 'Chemical Solutions Ltd', contactPerson: 'Shahid Hasan', city: 'Dhaka', paymentTerms: 'NET_30' as const },
  { code: 'SUP-005', name: 'Packaging Plus', contactPerson: 'Mizanur Rahman', city: 'Dhaka', paymentTerms: 'COD' as const },
  { code: 'SUP-006', name: 'Hardware World', contactPerson: 'Jamal Uddin', city: 'Dhaka', paymentTerms: 'NET_15' as const },
];

// Customers
const SAMPLE_CUSTOMERS = [
  // Retail
  { code: 'CUS-001', name: 'Ahmed Leather Shop', type: 'RETAIL' as const, city: 'Dhaka', creditLimit: 0, creditDays: 0 },
  { code: 'CUS-002', name: 'Fashion Corner', type: 'RETAIL' as const, city: 'Dhaka', creditLimit: 0, creditDays: 0 },
  { code: 'CUS-003', name: 'Mirpur Bags Store', type: 'RETAIL' as const, city: 'Dhaka', creditLimit: 0, creditDays: 0 },
  // Wholesale
  { code: 'CUS-101', name: 'Uttara Wholesalers Ltd', type: 'WHOLESALE' as const, city: 'Dhaka', creditLimit: 500000, creditDays: 30 },
  { code: 'CUS-102', name: 'Gulshan Trading House', type: 'WHOLESALE' as const, city: 'Dhaka', creditLimit: 750000, creditDays: 45 },
  { code: 'CUS-103', name: 'Chittagong Distributors', type: 'WHOLESALE' as const, city: 'Chittagong', creditLimit: 600000, creditDays: 30 },
  // Corporate
  { code: 'CUS-201', name: 'Bangladesh Leather Products Ltd', type: 'CORPORATE' as const, city: 'Dhaka', creditLimit: 2000000, creditDays: 60 },
  { code: 'CUS-202', name: 'Export Bangladesh Corporation', type: 'CORPORATE' as const, city: 'Chittagong', creditLimit: 3000000, creditDays: 90 },
  { code: 'CUS-203', name: 'LeatherCraft Industries', type: 'CORPORATE' as const, city: 'Dhaka', creditLimit: 1500000, creditDays: 45 },
  // Export
  { code: 'CUS-301', name: 'Global Leather Trading GmbH', type: 'EXPORT' as const, city: 'Berlin', creditLimit: 5000000, creditDays: 60 },
  { code: 'CUS-302', name: 'Euro Style Leather Co.', type: 'EXPORT' as const, city: 'Milan', creditLimit: 4000000, creditDays: 45 },
];

// Customer categories
const CUSTOMER_CATEGORIES = [
  { name: 'Retail', discountPct: 0 },
  { name: 'Wholesale', discountPct: 5 },
  { name: 'Corporate', discountPct: 10 },
  { name: 'Export', discountPct: 15 },
  { name: 'VIP', discountPct: 20 },
];

// Asset categories
const ASSET_CATEGORIES = [
  { name: 'Office Equipment', depreciationMethod: 'STRAIGHT_LINE' as const, defaultLifeMonths: 60, defaultSalvageRate: 0.1 },
  { name: 'Vehicles', depreciationMethod: 'STRAIGHT_LINE' as const, defaultLifeMonths: 60, defaultSalvageRate: 0.2 },
  { name: 'Machinery', depreciationMethod: 'STRAIGHT_LINE' as const, defaultLifeMonths: 120, defaultSalvageRate: 0.1 },
  { name: 'Furniture', depreciationMethod: 'STRAIGHT_LINE' as const, defaultLifeMonths: 84, defaultSalvageRate: 0.05 },
  { name: 'Computers & IT', depreciationMethod: 'STRAIGHT_LINE' as const, defaultLifeMonths: 36, defaultSalvageRate: 0 },
  { name: 'Building', depreciationMethod: 'STRAIGHT_LINE' as const, defaultLifeMonths: 240, defaultSalvageRate: 0.3 },
  { name: 'Land', depreciationMethod: 'NONE' as const, defaultLifeMonths: 0, defaultSalvageRate: 1 },
];

// Employees
const SAMPLE_EMPLOYEES = [
  { code: 'EMP-001', firstName: 'Rahim', lastName: 'Ahmed', designation: 'Manager', department: 'Administration', basicSalary: 50000 },
  { code: 'EMP-002', firstName: 'Karim', lastName: 'Hassan', designation: 'Accountant', department: 'Finance', basicSalary: 40000 },
  { code: 'EMP-003', firstName: 'Salman', lastName: 'Khan', designation: 'Sales Executive', department: 'Sales', basicSalary: 35000 },
  { code: 'EMP-004', firstName: 'Ali', lastName: 'Miah', designation: 'Warehouse Supervisor', department: 'Warehouse', basicSalary: 30000 },
  { code: 'EMP-005', firstName: 'Nadia', lastName: 'Begum', designation: 'HR Officer', department: 'HR', basicSalary: 35000 },
  { code: 'EMP-006', firstName: 'Jahid', lastName: 'Hasan', designation: 'Production Supervisor', department: 'Production', basicSalary: 32000 },
  { code: 'EMP-007', firstName: 'Rashid', lastName: 'Chowdhury', designation: 'Sales Manager', department: 'Sales', basicSalary: 45000 },
  { code: 'EMP-008', firstName: 'Priya', lastName: 'Devi', designation: 'Designer', department: 'Design', basicSalary: 38000 },
  { code: 'EMP-009', firstName: 'Monir', lastName: 'Uddin', designation: 'Machine Operator', department: 'Production', basicSalary: 25000 },
  { code: 'EMP-010', firstName: 'Fatema', lastName: 'Khatun', designation: 'Packer', department: 'Warehouse', basicSalary: 18000 },
];

// Sample approval rules
const APPROVAL_RULES = [
  { module: 'purchase', action: 'approve', minAmount: new Prisma.Decimal(50000), approverRoles: ['Admin', 'Purchase Manager'] },
  { module: 'purchase', action: 'approve', minAmount: new Prisma.Decimal(200000), approverRoles: ['Admin'] },
  { module: 'accounts', action: 'post', minAmount: new Prisma.Decimal(100000), approverRoles: ['Accountant', 'Admin'] },
  { module: 'assets', action: 'dispose', minAmount: new Prisma.Decimal(50000), approverRoles: ['Admin'] },
  { module: 'hr', action: 'approve-payroll', minAmount: new Prisma.Decimal(0), approverRoles: ['Admin', 'HR Manager'] },
  { module: 'corporate-sales', action: 'discount-override', minAmount: new Prisma.Decimal(100000), approverRoles: ['Admin', 'Sales Rep'] },
];

async function main() {
  console.log('🌱 Seeding foundation data…');

  // 1. Permissions
  const permKeys = allPermissions();
  for (const key of permKeys) {
    const [module, action] = key.split(':') as [string, string];
    await prisma.permission.upsert({
      where: { key },
      update: { module, action },
      create: { key, module, action },
    });
  }
  console.log(`  ✓ ${permKeys.length} permissions upserted`);

  // 2. Default branch
  const hqBranch = await prisma.branch.upsert({
    where: { code: 'HQ' },
    update: {},
    create: {
      code: 'HQ',
      name: 'Headquarters',
      type: 'MAIN',
      currency: 'BDT',
      address: '123 Leather Road, Dhaka 1000, Bangladesh',
      phone: '+880 2 12345678',
      email: 'hq@annex.local',
    },
  });
  console.log(`  ✓ Branch: ${hqBranch.name}`);

  // 3. Additional branches
  for (const b of ADDITIONAL_BRANCHES) {
    await prisma.branch.upsert({
      where: { code: b.code },
      update: {},
      create: b,
    });
  }
  console.log(`  ✓ ${ADDITIONAL_BRANCHES.length} additional branches`);

  // 4. Roles + role permissions
  for (const roleSpec of SYSTEM_ROLES) {
    const role = await prisma.role.upsert({
      where: { name: roleSpec.name },
      update: { description: roleSpec.description, isSystem: true },
      create: { name: roleSpec.name, description: roleSpec.description, isSystem: true },
    });
    const keys = roleSpec.permissions === 'ALL' ? permKeys : roleSpec.permissions;
    const perms = await prisma.permission.findMany({ where: { key: { in: keys } } });
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    await prisma.rolePermission.createMany({
      data: perms.map((p) => ({ roleId: role.id, permissionId: p.id })),
      skipDuplicates: true,
    });
  }
  console.log(`  ✓ ${SYSTEM_ROLES.length} roles seeded`);

  // 5. Users
  const branchMap = new Map<string, string>();
  const branches = await prisma.branch.findMany();
  branches.forEach((b) => branchMap.set(b.code, b.id));

  for (const userData of SAMPLE_USERS) {
    const role = await prisma.role.findUnique({ where: { name: userData.role } });
    if (!role) continue;

    const passwordHash = await bcrypt.hash('Demo@123', 10);
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {
        name: userData.name,
        defaultBranchId: branchMap.get(userData.branch),
        passwordHash,
      },
      create: {
        email: userData.email,
        name: userData.name,
        passwordHash,
        defaultBranchId: branchMap.get(userData.branch),
      },
    });
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: role.id } },
      update: {},
      create: { userId: user.id, roleId: role.id },
    });
  }
  console.log(`  ✓ ${SAMPLE_USERS.length} users seeded`);

  // 6. Initial fiscal period for HQ
  const now = new Date();
  const year = now.getFullYear();
  const hqPeriod = await prisma.period.upsert({
    where: { branchId_name: { branchId: hqBranch.id, name: `FY${year}-${String(year + 1).slice(2)} Current` } },
    update: {},
    create: {
      branchId: hqBranch.id,
      name: `FY${year}-${String(year + 1).slice(2)} Current`,
      startsAt: new Date(year, 3, 1),
      endsAt: new Date(year + 1, 2, 31),
      status: 'OPEN',
    },
  });

  // Create periods for other branches
  const otherBranches = await prisma.branch.findMany({ where: { code: { not: 'HQ' } } });
  for (const branch of otherBranches) {
    await prisma.period.upsert({
      where: { branchId_name: { branchId: branch.id, name: `FY${year}-${String(year + 1).slice(2)} Current` } },
      update: {},
      create: {
        branchId: branch.id,
        name: `FY${year}-${String(year + 1).slice(2)} Current`,
        startsAt: new Date(year, 3, 1),
        endsAt: new Date(year + 1, 2, 31),
        status: 'OPEN',
      },
    });
  }
  console.log('  ✓ Initial fiscal periods opened');

  // 7. Product categories
  for (const name of PRODUCT_CATEGORIES) {
    await prisma.productCategory.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log(`  ✓ ${PRODUCT_CATEGORIES.length} product categories`);

  // 8. Product brands
  for (const name of PRODUCT_BRANDS) {
    await prisma.productBrand.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log(`  ✓ ${PRODUCT_BRANDS.length} brands`);

  // 9. Products
  const categories = await prisma.productCategory.findMany();
  const brands = await prisma.productBrand.findMany();
  const categoryMap = new Map(categories.map((c) => [c.name, c.id]));
  const brandMap = new Map(brands.map((b) => [b.name, b.id]));

  // Map products to categories
  const productCategoryMap: Record<string, string> = {
    'FL-': 'Finished Leather',
    'RH-': 'Raw Hides',
    'CH-': 'Chemicals',
    'AC-': 'Accessories',
    'PK-': 'Packaging',
    'MA-': 'Machinery',
    'TL-': 'Tools',
  };

  for (const p of SAMPLE_PRODUCTS) {
    const prefix = p.sku.substring(0, 3);
    const categoryName = productCategoryMap[prefix] || 'Finished Leather';
    const brandName = p.type === 'RAW_MATERIAL' ? 'Generic' : 'Annex';

    await prisma.product.upsert({
      where: { sku: p.sku },
      update: {
        name: p.name,
        type: p.type,
        costPrice: new Prisma.Decimal(p.costPrice),
        sellPrice: new Prisma.Decimal(p.sellPrice),
        categoryId: categoryMap.get(categoryName),
        brandId: brandMap.get(brandName),
      },
      create: {
        sku: p.sku,
        barcode: `BR${p.sku}`,
        name: p.name,
        type: p.type,
        costPrice: new Prisma.Decimal(p.costPrice),
        sellPrice: new Prisma.Decimal(p.sellPrice),
        categoryId: categoryMap.get(categoryName),
        brandId: brandMap.get(brandName),
        reorderLevel: new Prisma.Decimal(10),
        reorderQty: new Prisma.Decimal(50),
      },
    });
  }
  console.log(`  ✓ ${SAMPLE_PRODUCTS.length} products`);

  // 10. Default warehouse for each branch
  const warehouseData = [
    { branchCode: 'HQ', code: 'MAIN', name: 'Main Warehouse', type: 'MAIN' as const },
    { branchCode: 'HQ', code: 'STORE', name: 'Showroom Store', type: 'SHOWROOM' as const },
    { branchCode: 'DHAKA', code: 'MAIN', name: 'Dhaka Showroom', type: 'SHOWROOM' as const },
    { branchCode: 'CTG', code: 'MAIN', name: 'Chittagong Warehouse', type: 'MAIN' as const },
    { branchCode: 'FACTORY', code: 'MAIN', name: 'Factory Storage', type: 'MAIN' as const },
    { branchCode: 'FACTORY', code: 'WIP', name: 'Work In Progress', type: 'WIP' as const },
    { branchCode: 'INDIA', code: 'MAIN', name: 'India Main', type: 'MAIN' as const },
  ];

  for (const w of warehouseData) {
    const branchId = branchMap.get(w.branchCode);
    if (!branchId) continue;
    await prisma.warehouse.upsert({
      where: { branchId_code: { branchId, code: w.code } },
      update: {},
      create: { branchId, code: w.code, name: w.name, type: w.type },
    });
  }
  console.log(`  ✓ ${warehouseData.length} warehouses`);

  // 11. Sample inventory ledger entries
  const products = await prisma.product.findMany();
  const warehouses = await prisma.warehouse.findMany();
  const mainWarehouse = warehouses.find((w) => w.code === 'MAIN')!;

  for (const product of products.slice(0, 15)) {
    // Add stock in ledger
    const qty = Math.floor(Math.random() * 200) + 50;
    await prisma.inventoryLedger.upsert({
      where: {
        id: `seed-${product.sku}-stockin`,
      },
      update: {},
      create: {
        id: `seed-${product.sku}-stockin`,
        branchId: hqBranch.id,
        warehouseId: mainWarehouse.id,
        productId: product.id,
        direction: 'IN',
        quantity: new Prisma.Decimal(qty),
        costPerUnit: product.costPrice,
        refType: 'OPENING',
        refId: null,
        note: 'Initial stock',
      },
    });
  }
  console.log(`  ✓ initial inventory ledger entries`);

  // 12. Suppliers
  for (const s of SAMPLE_SUPPLIERS) {
    await prisma.supplier.upsert({
      where: { code: s.code },
      update: {},
      create: {
        branchId: hqBranch.id,
        code: s.code,
        name: s.name,
        contactPerson: s.contactPerson,
        phone: '+880 1' + Math.floor(Math.random() * 100000000).toString().padStart(8, '0'),
        city: s.city,
        country: 'Bangladesh',
        paymentTerms: s.paymentTerms,
      },
    });
  }
  console.log(`  ✓ ${SAMPLE_SUPPLIERS.length} suppliers`);

  // 13. Customer categories
  for (const c of CUSTOMER_CATEGORIES) {
    await prisma.customerCategory.upsert({
      where: { name: c.name },
      update: {},
      create: { name: c.name, discountPct: new Prisma.Decimal(c.discountPct) },
    });
  }
  console.log(`  ✓ ${CUSTOMER_CATEGORIES.length} customer categories`);

  // 14. Customers
  const customerCategories = await prisma.customerCategory.findMany();
  const customerCategoryMap = new Map(customerCategories.map((c) => [c.name, c.id]));

  const customerTypeMap: Record<string, string> = {
    RETAIL: 'Retail',
    WHOLESALE: 'Wholesale',
    CORPORATE: 'Corporate',
    EXPORT: 'Export',
  };

  for (const c of SAMPLE_CUSTOMERS) {
    await prisma.customer.upsert({
      where: { code: c.code },
      update: {},
      create: {
        branchId: hqBranch.id,
        code: c.code,
        name: c.name,
        type: c.type,
        categoryId: customerCategoryMap.get(customerTypeMap[c.type]) ?? undefined,
        city: c.city,
        country: c.type === 'EXPORT' ? 'Germany' : 'Bangladesh',
        creditLimit: new Prisma.Decimal(c.creditLimit),
        creditDays: c.creditDays,
      },
    });
  }
  console.log(`  ✓ ${SAMPLE_CUSTOMERS.length} customers`);

  // 15. Asset categories
  for (const a of ASSET_CATEGORIES) {
    await prisma.assetCategory.upsert({
      where: { name: a.name },
      update: {},
      create: {
        name: a.name,
        depreciationMethod: a.depreciationMethod,
        defaultLifeMonths: a.defaultLifeMonths,
        defaultSalvageRate: new Prisma.Decimal(a.defaultSalvageRate),
      },
    });
  }
  console.log(`  ✓ ${ASSET_CATEGORIES.length} asset categories`);

  // 16. Employees
  for (const e of SAMPLE_EMPLOYEES) {
    await prisma.employee.upsert({
      where: { code: e.code },
      update: {},
      create: {
        branchId: hqBranch.id,
        code: e.code,
        firstName: e.firstName,
        lastName: e.lastName,
        designation: e.designation,
        department: e.department,
        joinedAt: new Date(year - Math.floor(Math.random() * 5), Math.floor(Math.random() * 12), 1),
        basicSalary: new Prisma.Decimal(e.basicSalary),
        houseAllowance: new Prisma.Decimal(e.basicSalary * 0.2),
        transportAllowance: new Prisma.Decimal(e.basicSalary * 0.1),
        medicalAllowance: new Prisma.Decimal(e.basicSalary * 0.05),
        providentFund: new Prisma.Decimal(e.basicSalary * 0.05),
      },
    });
  }
  console.log(`  ✓ ${SAMPLE_EMPLOYEES.length} employees`);

  // 17. Approval rules
  for (const rule of APPROVAL_RULES) {
    await prisma.approvalRule.upsert({
      where: {
        module_action_minAmount: {
          module: rule.module,
          action: rule.action,
          minAmount: rule.minAmount,
        },
      },
      update: {},
      create: {
        name: `${rule.module}:${rule.action}`,
        module: rule.module,
        action: rule.action,
        minAmount: rule.minAmount,
        approverRoles: rule.approverRoles,
        escalateAfterHours: 24,
        isActive: true,
      },
    });
  }
  console.log(`  ✓ ${APPROVAL_RULES.length} approval rules`);

  // 18. Chart of Accounts
  type CoaSeed = {
    code: string;
    name: string;
    type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'INCOME' | 'EXPENSE';
    normalSide: 'DEBIT' | 'CREDIT';
    parent?: string;
    isPosting?: boolean;
    isControl?: boolean;
    systemKey?:
      | 'CASH'
      | 'BANK_DEFAULT'
      | 'AR_CONTROL'
      | 'AP_CONTROL'
      | 'INVENTORY'
      | 'COGS'
      | 'SALES_REVENUE'
      | 'SALES_RETURNS'
      | 'DISCOUNT_GIVEN'
      | 'TAX_PAYABLE'
      | 'TAX_RECOVERABLE'
      | 'PURCHASE_EXPENSE'
      | 'FX_GAIN'
      | 'FX_LOSS'
      | 'RETAINED_EARNINGS'
      | 'OPENING_BALANCE_EQUITY'
      | 'ROUNDING';
  };
  const COA: CoaSeed[] = [
    // Assets
    { code: '1000', name: 'Assets', type: 'ASSET', normalSide: 'DEBIT', isPosting: false },
    { code: '1100', name: 'Current Assets', type: 'ASSET', normalSide: 'DEBIT', parent: '1000', isPosting: false },
    { code: '1110', name: 'Cash on Hand', type: 'ASSET', normalSide: 'DEBIT', parent: '1100', systemKey: 'CASH' },
    { code: '1120', name: 'Bank — Operating', type: 'ASSET', normalSide: 'DEBIT', parent: '1100', systemKey: 'BANK_DEFAULT' },
    {
      code: '1130',
      name: 'Accounts Receivable',
      type: 'ASSET',
      normalSide: 'DEBIT',
      parent: '1100',
      isControl: true,
      systemKey: 'AR_CONTROL',
    },
    {
      code: '1140',
      name: 'Inventory',
      type: 'ASSET',
      normalSide: 'DEBIT',
      parent: '1100',
      isControl: true,
      systemKey: 'INVENTORY',
    },
    { code: '1150', name: 'Input Tax Recoverable', type: 'ASSET', normalSide: 'DEBIT', parent: '1100', systemKey: 'TAX_RECOVERABLE' },
    { code: '1200', name: 'Fixed Assets', type: 'ASSET', normalSide: 'DEBIT', parent: '1000', isPosting: false },
    { code: '1210', name: 'Machinery & Equipment', type: 'ASSET', normalSide: 'DEBIT', parent: '1200' },
    { code: '1220', name: 'Accumulated Depreciation', type: 'ASSET', normalSide: 'CREDIT', parent: '1200' },
    { code: '1230', name: 'Vehicles', type: 'ASSET', normalSide: 'DEBIT', parent: '1200' },
    { code: '1240', name: 'Office Equipment', type: 'ASSET', normalSide: 'DEBIT', parent: '1200' },

    // Liabilities
    { code: '2000', name: 'Liabilities', type: 'LIABILITY', normalSide: 'CREDIT', isPosting: false },
    {
      code: '2100',
      name: 'Accounts Payable',
      type: 'LIABILITY',
      normalSide: 'CREDIT',
      parent: '2000',
      isControl: true,
      systemKey: 'AP_CONTROL',
    },
    { code: '2200', name: 'Tax Payable', type: 'LIABILITY', normalSide: 'CREDIT', parent: '2000', systemKey: 'TAX_PAYABLE' },
    { code: '2300', name: 'Accrued Expenses', type: 'LIABILITY', normalSide: 'CREDIT', parent: '2000' },
    { code: '2400', name: 'Provident Fund', type: 'LIABILITY', normalSide: 'CREDIT', parent: '2000' },

    // Equity
    { code: '3000', name: 'Equity', type: 'EQUITY', normalSide: 'CREDIT', isPosting: false },
    { code: '3100', name: "Owner's Capital", type: 'EQUITY', normalSide: 'CREDIT', parent: '3000' },
    { code: '3200', name: 'Retained Earnings', type: 'EQUITY', normalSide: 'CREDIT', parent: '3000', systemKey: 'RETAINED_EARNINGS' },
    {
      code: '3900',
      name: 'Opening Balance Equity',
      type: 'EQUITY',
      normalSide: 'CREDIT',
      parent: '3000',
      systemKey: 'OPENING_BALANCE_EQUITY',
    },

    // Income
    { code: '4000', name: 'Income', type: 'INCOME', normalSide: 'CREDIT', isPosting: false },
    { code: '4100', name: 'Sales Revenue', type: 'INCOME', normalSide: 'CREDIT', parent: '4000', systemKey: 'SALES_REVENUE' },
    { code: '4150', name: 'Sales Returns & Allowances', type: 'INCOME', normalSide: 'DEBIT', parent: '4000', systemKey: 'SALES_RETURNS' },
    { code: '4200', name: 'FX Gain', type: 'INCOME', normalSide: 'CREDIT', parent: '4000', systemKey: 'FX_GAIN' },
    { code: '4900', name: 'Rounding Income', type: 'INCOME', normalSide: 'CREDIT', parent: '4000', systemKey: 'ROUNDING' },

    // Expenses
    { code: '5000', name: 'Expenses', type: 'EXPENSE', normalSide: 'DEBIT', isPosting: false },
    { code: '5100', name: 'Cost of Goods Sold', type: 'EXPENSE', normalSide: 'DEBIT', parent: '5000', systemKey: 'COGS' },
    { code: '5150', name: 'Discount Given', type: 'EXPENSE', normalSide: 'DEBIT', parent: '5000', systemKey: 'DISCOUNT_GIVEN' },
    { code: '5200', name: 'Purchase Expense (non-stock)', type: 'EXPENSE', normalSide: 'DEBIT', parent: '5000', systemKey: 'PURCHASE_EXPENSE' },
    { code: '5300', name: 'Operating Expenses', type: 'EXPENSE', normalSide: 'DEBIT', parent: '5000', isPosting: false },
    { code: '5310', name: 'Salaries & Wages', type: 'EXPENSE', normalSide: 'DEBIT', parent: '5300' },
    { code: '5320', name: 'Rent', type: 'EXPENSE', normalSide: 'DEBIT', parent: '5300' },
    { code: '5330', name: 'Utilities', type: 'EXPENSE', normalSide: 'DEBIT', parent: '5300' },
    { code: '5340', name: 'Depreciation', type: 'EXPENSE', normalSide: 'DEBIT', parent: '5300' },
    { code: '5350', name: 'Repairs & Maintenance', type: 'EXPENSE', normalSide: 'DEBIT', parent: '5300' },
    { code: '5400', name: 'FX Loss', type: 'EXPENSE', normalSide: 'DEBIT', parent: '5000', systemKey: 'FX_LOSS' },
    { code: '5500', name: 'Other Expenses', type: 'EXPENSE', normalSide: 'DEBIT', parent: '5000' },
  ];

  const codeToId = new Map<string, string>();
  for (const a of COA) {
    const parentId = a.parent ? codeToId.get(a.parent) ?? null : null;
    const parent = parentId ? await prisma.chartAccount.findUnique({ where: { id: parentId } }) : null;
    const path = parent ? `${parent.path}/${a.code}` : a.code;
    const depth = parent ? parent.depth + 1 : 0;

    const account = await prisma.chartAccount.upsert({
      where: { code: a.code },
      update: {
        name: a.name,
        type: a.type,
        normalSide: a.normalSide,
        parentId,
        path,
        depth,
        isPosting: a.isPosting ?? true,
        isControl: a.isControl ?? false,
        isSystem: true,
      },
      create: {
        code: a.code,
        name: a.name,
        type: a.type,
        normalSide: a.normalSide,
        parentId,
        path,
        depth,
        isPosting: a.isPosting ?? true,
        isControl: a.isControl ?? false,
        isSystem: true,
      },
    });
    codeToId.set(a.code, account.id);

    if (a.systemKey) {
      const existing = await prisma.systemAccountMapping.findFirst({
        where: { key: a.systemKey, branchId: null },
      });
      if (existing) {
        await prisma.systemAccountMapping.update({
          where: { id: existing.id },
          data: { accountId: account.id },
        });
      } else {
        await prisma.systemAccountMapping.create({
          data: { key: a.systemKey, branchId: null, accountId: account.id },
        });
      }
    }
  }
  console.log(`  ✓ ${COA.length} chart-of-account rows + system mappings`);

  console.log('\n🎉 Seed complete!');
  console.log('\n📋 Login credentials:');
  console.log('   Admin: admin@annex.local / Admin@12345');
  console.log('   Accountant: accountant@annex.local / Demo@123');
  console.log('   Cashier: cashier@annex.local / Demo@123');
  console.log('   (All users have default password: Demo@123)');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
import { PrismaClient } from '@prisma/client';
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
  const branch = await prisma.branch.upsert({
    where: { code: 'HQ' },
    update: {},
    create: {
      code: 'HQ',
      name: 'Main Branch',
      type: 'MAIN',
      currency: 'BDT',
    },
  });
  console.log(`  ✓ Branch: ${branch.name}`);

  // 3. Roles + role permissions
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

  // 4. Super admin user
  const adminEmail = 'admin@annex.local';
  const adminPassword = 'Admin@12345';
  const superAdminRole = await prisma.role.findUniqueOrThrow({ where: { name: 'Super Admin' } });
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { defaultBranchId: branch.id },
    create: {
      email: adminEmail,
      name: 'Admin User',
      passwordHash: await bcrypt.hash(adminPassword, 10),
      defaultBranchId: branch.id,
    },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: admin.id, roleId: superAdminRole.id } },
    update: {},
    create: { userId: admin.id, roleId: superAdminRole.id },
  });
  console.log(`  ✓ Super admin: ${adminEmail} / ${adminPassword}  (change on first login)`);

  // 5. Initial fiscal period
  const now = new Date();
  const year = now.getFullYear();
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
  console.log('  ✓ Initial fiscal period opened');

  // 6. Sample product categories
  const categoryNames = ['Finished Leather', 'Raw Hides', 'Chemicals', 'Accessories', 'Packaging'];
  for (const name of categoryNames) {
    await prisma.productCategory.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log(`  ✓ ${categoryNames.length} product categories`);

  // 7. Sample brands
  const brandNames = ['Annex', 'Generic', 'Imported'];
  for (const name of brandNames) {
    await prisma.productBrand.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log(`  ✓ ${brandNames.length} brands`);

  // 8. Default warehouse for each branch
  const allBranches = await prisma.branch.findMany();
  for (const b of allBranches) {
    await prisma.warehouse.upsert({
      where: { branchId_code: { branchId: b.id, code: 'MAIN' } },
      update: {},
      create: {
        branchId: b.id,
        code: 'MAIN',
        name: `${b.name} — Main Warehouse`,
        type: 'MAIN',
      },
    });
  }
  console.log(`  ✓ default warehouse per branch`);

  // 9. Default Chart of Accounts
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
    { code: '5400', name: 'FX Loss', type: 'EXPENSE', normalSide: 'DEBIT', parent: '5000', systemKey: 'FX_LOSS' },
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

  console.log('✅ Seed complete');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

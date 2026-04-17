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

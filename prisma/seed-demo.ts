import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

const D = (n: number | string) => new Prisma.Decimal(n);
const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};

async function main() {
  console.log('🌱 Seeding demo data…');

  const branch = await prisma.branch.findUniqueOrThrow({ where: { code: 'HQ' } });
  const warehouse = await prisma.warehouse.findUniqueOrThrow({
    where: { branchId_code: { branchId: branch.id, code: 'MAIN' } },
  });
  const admin = await prisma.user.findUniqueOrThrow({ where: { email: 'admin@annex.local' } });
  const categories = await prisma.productCategory.findMany();
  const catByName = Object.fromEntries(categories.map((c) => [c.name, c.id]));
  const brands = await prisma.productBrand.findMany();
  const brandByName = Object.fromEntries(brands.map((b) => [b.name, b.id]));

  // 1. Products with opening stock
  const products = [
    { sku: 'LTH-BLK-001', barcode: '8900000000011', name: 'Full-grain Black Leather Sheet', category: 'Finished Leather', brand: 'Annex',    cost: 1200, sell: 1800, unit: 'M2'  as const, qty: 120, reorder: 25 },
    { sku: 'LTH-BRN-002', barcode: '8900000000028', name: 'Full-grain Brown Leather Sheet', category: 'Finished Leather', brand: 'Annex',    cost: 1150, sell: 1750, unit: 'M2'  as const, qty: 95,  reorder: 25 },
    { sku: 'HIDE-RAW-001', barcode: '8900000000035', name: 'Raw Cow Hide (medium)',         category: 'Raw Hides',        brand: 'Generic',  cost: 900,  sell: 0,    unit: 'PCS' as const, qty: 8,   reorder: 30 },
    { sku: 'CHEM-CRM-010', barcode: '8900000000042', name: 'Chrome Tanning Agent 25kg',     category: 'Chemicals',        brand: 'Imported', cost: 3200, sell: 0,    unit: 'KG'  as const, qty: 4,   reorder: 10 },
    { sku: 'CHEM-DYE-020', barcode: '8900000000059', name: 'Black Leather Dye 5L',          category: 'Chemicals',        brand: 'Imported', cost: 1400, sell: 0,    unit: 'L'   as const, qty: 24,  reorder: 15 },
    { sku: 'ACC-BCK-001',  barcode: '8900000000066', name: 'Metal Buckle (silver)',         category: 'Accessories',      brand: 'Generic',  cost: 35,   sell: 75,   unit: 'PCS' as const, qty: 1500, reorder: 200 },
    { sku: 'ACC-THR-001',  barcode: '8900000000073', name: 'Waxed Thread Spool 100m',       category: 'Accessories',      brand: 'Generic',  cost: 120,  sell: 220,  unit: 'PCS' as const, qty: 15,  reorder: 50 },
    { sku: 'PKG-BOX-L',    barcode: '8900000000080', name: 'Shipping Box — Large',          category: 'Packaging',        brand: 'Generic',  cost: 45,   sell: 0,    unit: 'BOX' as const, qty: 400, reorder: 100 },
  ];

  for (const p of products) {
    const created = await prisma.product.upsert({
      where: { sku: p.sku },
      update: { reorderLevel: D(p.reorder) },
      create: {
        sku: p.sku,
        barcode: p.barcode,
        name: p.name,
        categoryId: catByName[p.category],
        brandId: brandByName[p.brand],
        costPrice: D(p.cost),
        sellPrice: D(p.sell),
        reorderLevel: D(p.reorder),
        unit: p.unit,
      },
    });

    const hasOpening = await prisma.inventoryLedger.findFirst({
      where: { productId: created.id, refType: 'OPENING_STOCK' },
    });
    if (!hasOpening && p.qty > 0) {
      await prisma.inventoryLedger.create({
        data: {
          branchId: branch.id,
          warehouseId: warehouse.id,
          productId: created.id,
          direction: 'IN',
          quantity: D(p.qty),
          costPerUnit: D(p.cost),
          refType: 'OPENING_STOCK',
          note: 'Demo opening balance',
        },
      });
    }
  }
  console.log(`  ✓ ${products.length} products (reorder levels set, 3 below threshold)`);

  // 2. Suppliers
  const suppliers = [
    { code: 'SUP-001', name: 'Chittagong Tannery Co.',   contactPerson: 'Rafiq Hossain',   phone: '+8801711223344', email: 'sales@ctg-tannery.bd',    city: 'Chittagong', country: 'Bangladesh' },
    { code: 'SUP-002', name: 'Kolkata Leather Imports',  contactPerson: 'Arjun Banerjee',  phone: '+919830112233',  email: 'orders@kolkata-leather.in', city: 'Kolkata',    country: 'India' },
    { code: 'SUP-003', name: 'BD Chem Traders',          contactPerson: 'Nasir Uddin',     phone: '+8801812345678', email: 'info@bdchem.bd',           city: 'Dhaka',      country: 'Bangladesh' },
  ];
  for (const s of suppliers) {
    await prisma.supplier.upsert({
      where: { code: s.code },
      update: {},
      create: { ...s, branchId: branch.id, paymentTerms: 'NET_30', currency: 'BDT' },
    });
  }
  console.log(`  ✓ ${suppliers.length} suppliers`);

  // 3. Customer categories + customers
  const customerCategories = [
    { name: 'Retail',    discountPct: 0 },
    { name: 'Wholesale', discountPct: 10 },
    { name: 'Corporate', discountPct: 15 },
  ];
  for (const c of customerCategories) {
    await prisma.customerCategory.upsert({
      where: { name: c.name },
      update: {},
      create: { name: c.name, discountPct: D(c.discountPct) },
    });
  }
  const retailCat = await prisma.customerCategory.findUniqueOrThrow({ where: { name: 'Retail' } });
  const wholesaleCat = await prisma.customerCategory.findUniqueOrThrow({ where: { name: 'Wholesale' } });
  const corpCat = await prisma.customerCategory.findUniqueOrThrow({ where: { name: 'Corporate' } });

  const customers = [
    { code: 'CUS-001', name: 'Walk-in Retail',       type: 'RETAIL'    as const, categoryId: retailCat.id,    creditLimit: 0,       creditDays: 0 },
    { code: 'CUS-002', name: 'Dhaka Bag House',      type: 'WHOLESALE' as const, categoryId: wholesaleCat.id, creditLimit: 500000,  creditDays: 30, phone: '+8801912345678', email: 'buyer@dhakabag.bd',    city: 'Dhaka',  country: 'Bangladesh' },
    { code: 'CUS-003', name: 'Lotus Footwear Ltd.',  type: 'CORPORATE' as const, categoryId: corpCat.id,      creditLimit: 2000000, creditDays: 45, phone: '+8801712000111', email: 'procurement@lotusfw.bd', city: 'Dhaka', country: 'Bangladesh' },
    { code: 'CUS-004', name: 'Khulna Leather Mart',  type: 'WHOLESALE' as const, categoryId: wholesaleCat.id, creditLimit: 300000,  creditDays: 30, phone: '+8801811234567', email: 'orders@khulnamart.bd', city: 'Khulna', country: 'Bangladesh' },
    { code: 'CUS-005', name: 'Artisan Crafts BD',    type: 'RETAIL'    as const, categoryId: retailCat.id,    creditLimit: 50000,   creditDays: 15, phone: '+8801555000222', city: 'Dhaka', country: 'Bangladesh' },
  ];
  for (const c of customers) {
    await prisma.customer.upsert({
      where: { code: c.code },
      update: {},
      create: { ...c, branchId: branch.id, currency: 'BDT', creditLimit: D(c.creditLimit) },
    });
  }
  console.log(`  ✓ ${customerCategories.length} customer categories, ${customers.length} customers`);

  // 4. Employees
  const employees = [
    { code: 'EMP-001', firstName: 'Sultana', lastName: 'Begum',  email: 'sultana@annex.local', phone: '+8801711000001', designation: 'Accountant',           department: 'Finance',   basic: 45000, house: 12000, transport: 3000 },
    { code: 'EMP-002', firstName: 'Imran',   lastName: 'Hasan',  email: 'imran@annex.local',   phone: '+8801711000002', designation: 'Warehouse Supervisor', department: 'Warehouse', basic: 35000, house: 8000,  transport: 2500 },
    { code: 'EMP-003', firstName: 'Sabrina', lastName: 'Akter',  email: 'sabrina@annex.local', phone: '+8801711000003', designation: 'Sales Executive',      department: 'Sales',     basic: 30000, house: 7000,  transport: 2000 },
    { code: 'EMP-004', firstName: 'Tareq',   lastName: 'Rahman', email: 'tareq@annex.local',   phone: '+8801711000004', designation: 'Production Manager',   department: 'Factory',   basic: 55000, house: 15000, transport: 4000 },
  ];
  for (const e of employees) {
    await prisma.employee.upsert({
      where: { code: e.code },
      update: {},
      create: {
        branchId: branch.id,
        code: e.code,
        firstName: e.firstName,
        lastName: e.lastName,
        email: e.email,
        phone: e.phone,
        designation: e.designation,
        department: e.department,
        joinedAt: new Date('2025-01-15'),
        basicSalary: D(e.basic),
        houseAllowance: D(e.house),
        transportAllowance: D(e.transport),
        medicalAllowance: D(2000),
      },
    });
  }
  console.log(`  ✓ ${employees.length} employees`);

  // 5. POS sales (for Sales MTD + recent POS sales)
  const walkIn = await prisma.customer.findUniqueOrThrow({ where: { code: 'CUS-001' } });
  const artisan = await prisma.customer.findUniqueOrThrow({ where: { code: 'CUS-005' } });
  const blackSheet = await prisma.product.findUniqueOrThrow({ where: { sku: 'LTH-BLK-001' } });
  const brownSheet = await prisma.product.findUniqueOrThrow({ where: { sku: 'LTH-BRN-002' } });
  const buckle = await prisma.product.findUniqueOrThrow({ where: { sku: 'ACC-BCK-001' } });
  const thread = await prisma.product.findUniqueOrThrow({ where: { sku: 'ACC-THR-001' } });

  const posSales = [
    { number: 'POS-DEMO-0001', customerId: walkIn.id,  daysAgo: 1, items: [{ p: blackSheet, qty: 2, price: 1800 }, { p: buckle, qty: 10, price: 75 }] },
    { number: 'POS-DEMO-0002', customerId: walkIn.id,  daysAgo: 2, items: [{ p: brownSheet, qty: 1, price: 1750 }, { p: thread, qty: 3,  price: 220 }] },
    { number: 'POS-DEMO-0003', customerId: artisan.id, daysAgo: 3, items: [{ p: buckle,     qty: 25, price: 75 }] },
    { number: 'POS-DEMO-0004', customerId: walkIn.id,  daysAgo: 4, items: [{ p: blackSheet, qty: 1, price: 1800 }] },
    { number: 'POS-DEMO-0005', customerId: artisan.id, daysAgo: 5, items: [{ p: thread,     qty: 10, price: 220 }, { p: buckle, qty: 20, price: 75 }] },
    { number: 'POS-DEMO-0006', customerId: walkIn.id,  daysAgo: 6, items: [{ p: brownSheet, qty: 3, price: 1750 }] },
  ];
  for (const s of posSales) {
    const existing = await prisma.posSale.findUnique({ where: { number: s.number } });
    if (existing) continue;
    const subtotal = s.items.reduce((sum, it) => sum + it.qty * it.price, 0);
    const grand = subtotal;
    await prisma.posSale.create({
      data: {
        number: s.number,
        branchId: branch.id,
        warehouseId: warehouse.id,
        customerId: s.customerId,
        cashierId: admin.id,
        saleDate: daysAgo(s.daysAgo),
        subtotal: D(subtotal),
        grandTotal: D(grand),
        paidTotal: D(grand),
        status: 'COMPLETED',
        items: {
          create: s.items.map((it) => ({
            productId: it.p.id,
            unit: it.p.unit,
            quantity: D(it.qty),
            unitPrice: D(it.price),
            lineTotal: D(it.qty * it.price),
          })),
        },
        payments: {
          create: [{ method: 'CASH', amount: D(grand) }],
        },
      },
    });
  }
  console.log(`  ✓ ${posSales.length} POS sales`);

  // 6. Purchase invoices (for Purchases MTD + Payable)
  const supCtg = await prisma.supplier.findUniqueOrThrow({ where: { code: 'SUP-001' } });
  const supKol = await prisma.supplier.findUniqueOrThrow({ where: { code: 'SUP-002' } });
  const supBd  = await prisma.supplier.findUniqueOrThrow({ where: { code: 'SUP-003' } });
  const rawHide = await prisma.product.findUniqueOrThrow({ where: { sku: 'HIDE-RAW-001' } });
  const tanAgent = await prisma.product.findUniqueOrThrow({ where: { sku: 'CHEM-CRM-010' } });
  const dye = await prisma.product.findUniqueOrThrow({ where: { sku: 'CHEM-DYE-020' } });

  const purchaseInvoices = [
    { number: 'PINV-DEMO-0001', supplierId: supCtg.id, daysAgo: 6,  dueDays: 24, items: [{ p: rawHide,  qty: 20, price: 900 }],  paid: 0 },
    { number: 'PINV-DEMO-0002', supplierId: supKol.id, daysAgo: 10, dueDays: 20, items: [{ p: tanAgent, qty: 10, price: 3200 }], paid: 20000 },
    { number: 'PINV-DEMO-0003', supplierId: supBd.id,  daysAgo: 14, dueDays: 16, items: [{ p: dye,      qty: 12, price: 1400 }], paid: 16800 },
  ];
  for (const inv of purchaseInvoices) {
    const existing = await prisma.purchaseInvoice.findUnique({ where: { number: inv.number } });
    if (existing) continue;
    const subtotal = inv.items.reduce((sum, it) => sum + it.qty * it.price, 0);
    const status = inv.paid === 0 ? 'PENDING' : inv.paid >= subtotal ? 'PAID' : 'PARTIALLY_PAID';
    await prisma.purchaseInvoice.create({
      data: {
        number: inv.number,
        branchId: branch.id,
        supplierId: inv.supplierId,
        invoiceDate: daysAgo(inv.daysAgo),
        dueDate: daysAgo(inv.daysAgo - inv.dueDays),
        subtotal: D(subtotal),
        grandTotal: D(subtotal),
        paidAmount: D(inv.paid),
        status,
        items: {
          create: inv.items.map((it) => ({
            productId: it.p.id,
            unit: it.p.unit,
            quantity: D(it.qty),
            unitPrice: D(it.price),
            lineTotal: D(it.qty * it.price),
          })),
        },
      },
    });
  }
  console.log(`  ✓ ${purchaseInvoices.length} purchase invoices`);

  // 7. Supplier payments (for Recent supplier payments)
  const supplierPayments = [
    { number: 'SPAY-DEMO-0001', supplierId: supKol.id, daysAgo: 3, amount: 20000, method: 'BANK_TRANSFER' as const, invoiceNumber: 'PINV-DEMO-0002' },
    { number: 'SPAY-DEMO-0002', supplierId: supBd.id,  daysAgo: 5, amount: 16800, method: 'MOBILE_BANKING' as const, invoiceNumber: 'PINV-DEMO-0003' },
    { number: 'SPAY-DEMO-0003', supplierId: supCtg.id, daysAgo: 8, amount: 5000,  method: 'CASH' as const, invoiceNumber: null },
  ];
  for (const pay of supplierPayments) {
    const existing = await prisma.supplierPayment.findUnique({ where: { number: pay.number } });
    if (existing) continue;
    const invoice = pay.invoiceNumber
      ? await prisma.purchaseInvoice.findUnique({ where: { number: pay.invoiceNumber } })
      : null;
    await prisma.supplierPayment.create({
      data: {
        number: pay.number,
        branchId: branch.id,
        supplierId: pay.supplierId,
        invoiceId: invoice?.id,
        method: pay.method,
        paymentDate: daysAgo(pay.daysAgo),
        amount: D(pay.amount),
      },
    });
  }
  console.log(`  ✓ ${supplierPayments.length} supplier payments`);

  // 8. Pending approval requests
  const approvals = [
    { module: 'purchase',        action: 'create',  title: 'PO #PO-2026-014 — Chittagong Tannery',     summary: '20 raw hides @ 900 BDT',   amount: 18000,  entityType: 'PurchaseOrder' },
    { module: 'pos',             action: 'discount-override', title: 'High discount — POS-000128',      summary: '18% discount on 12,500 BDT sale', amount: 12500, entityType: 'PosSale' },
    { module: 'corporate-sales', action: 'quote-discount',    title: 'Corp quote — Lotus Footwear',      summary: 'Request 20% discount on bulk order', amount: 450000, entityType: 'CorporateQuote' },
    { module: 'assets',          action: 'disposal', title: 'Dispose old cutting machine',              summary: 'Book value 45,000 BDT',              amount: 45000, entityType: 'Asset' },
  ];
  for (const a of approvals) {
    const existing = await prisma.approvalRequest.findFirst({
      where: { title: a.title, status: 'PENDING' },
    });
    if (existing) continue;
    await prisma.approvalRequest.create({
      data: {
        module: a.module,
        action: a.action,
        title: a.title,
        summary: a.summary,
        amount: D(a.amount),
        currency: 'BDT',
        entityType: a.entityType,
        entityId: `demo-${a.entityType}-${Date.now()}`,
        requestedById: admin.id,
        branchId: branch.id,
        status: 'PENDING',
        steps: {
          create: [{ sequence: 1, approverRole: 'Admin', status: 'WAITING' }],
        },
      },
    });
  }
  console.log(`  ✓ ${approvals.length} pending approval requests`);

  // 9. Wholesale invoices (for Receivable + multi-channel Sales card)
  const dhakaBag = await prisma.customer.findUniqueOrThrow({ where: { code: 'CUS-002' } });
  const khulna = await prisma.customer.findUniqueOrThrow({ where: { code: 'CUS-004' } });

  const wholesaleInvoices = [
    { number: 'WS-DEMO-0001', customerId: dhakaBag.id, daysAgo: 3,  items: [{ p: blackSheet, qty: 15, price: 1800 }, { p: buckle, qty: 200, price: 75 }], paid: 0 },
    { number: 'WS-DEMO-0002', customerId: khulna.id,   daysAgo: 7,  items: [{ p: brownSheet, qty: 20, price: 1750 }, { p: thread, qty: 50,  price: 220 }], paid: 10000 },
    { number: 'WS-DEMO-0003', customerId: dhakaBag.id, daysAgo: 12, items: [{ p: blackSheet, qty: 8,  price: 1800 }], paid: 14400 },
  ];
  for (const w of wholesaleInvoices) {
    const existing = await prisma.wholesaleInvoice.findUnique({ where: { number: w.number } });
    if (existing) continue;
    const subtotal = w.items.reduce((sum, it) => sum + it.qty * it.price, 0);
    const balance = subtotal - w.paid;
    const status = w.paid === 0 ? 'CONFIRMED' : balance <= 0 ? 'PAID' : 'PARTIALLY_PAID';
    await prisma.wholesaleInvoice.create({
      data: {
        number: w.number,
        branchId: branch.id,
        warehouseId: warehouse.id,
        customerId: w.customerId,
        invoiceDate: daysAgo(w.daysAgo),
        subtotal: D(subtotal),
        grandTotal: D(subtotal),
        paidTotal: D(w.paid),
        balanceDue: D(balance),
        status,
        items: {
          create: w.items.map((it) => ({
            productId: it.p.id,
            unit: it.p.unit,
            quantity: D(it.qty),
            unitPrice: D(it.price),
            lineTotal: D(it.qty * it.price),
          })),
        },
      },
    });
  }
  console.log(`  ✓ ${wholesaleInvoices.length} wholesale invoices`);

  // 10. Notifications for admin
  const notifications = [
    { severity: 'WARNING'  as const, module: 'inventory', title: 'Low stock alert',          body: '3 products have dropped below reorder level.', href: '/reports/inventory' },
    { severity: 'INFO'     as const, module: 'purchase',  title: 'New GRN received',         body: 'GRN #GRN-000045 posted against PO-014.',      href: '/purchase/grn' },
    { severity: 'CRITICAL' as const, module: 'accounts',  title: 'Fiscal period closing soon', body: 'Current period ends in 12 days — review unposted entries.', href: '/accounts/periods' },
    { severity: 'INFO'     as const, module: 'hr',        title: 'Payroll run due',          body: 'Monthly payroll run scheduled for end of month.', href: '/hr/payroll' },
    { severity: 'WARNING'  as const, module: 'approvals', title: 'Approvals awaiting you',   body: '4 approval requests are pending your decision.', href: '/approvals' },
  ];
  for (const n of notifications) {
    const existing = await prisma.notification.findFirst({
      where: { recipientId: admin.id, title: n.title, readAt: null },
    });
    if (existing) continue;
    await prisma.notification.create({
      data: {
        recipientId: admin.id,
        branchId: branch.id,
        severity: n.severity,
        module: n.module,
        title: n.title,
        body: n.body,
        href: n.href,
      },
    });
  }
  console.log(`  ✓ ${notifications.length} notifications`);

  console.log('✅ Demo seed complete');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient, Prisma, ProductType, UnitOfMeasure } from '@prisma/client';

const prisma = new PrismaClient();
const D = (n: number | string) => new Prisma.Decimal(n);

type Seed = {
  sku: string;
  barcode: string;
  name: string;
  category: string;
  brand: string;
  cost: number;
  sell: number;
  unit: UnitOfMeasure;
  type: ProductType;
  qty: number;
  reorder: number;
};

async function main() {
  console.log('🌱 Seeding raw materials and other stock…');

  const branch = await prisma.branch.findUniqueOrThrow({ where: { code: 'HQ' } });
  const warehouse = await prisma.warehouse.findUniqueOrThrow({
    where: { branchId_code: { branchId: branch.id, code: 'MAIN' } },
  });

  // 1. Extra categories
  const extraCategories = ['Hardware', 'Adhesives', 'Dyes & Finishes', 'Tools & Consumables', 'Work in Progress'];
  for (const name of extraCategories) {
    await prisma.productCategory.upsert({ where: { name }, update: {}, create: { name } });
  }
  console.log(`  ✓ ${extraCategories.length} extra categories`);

  // 2. Ensure brands exist
  for (const name of ['Annex', 'Generic', 'Imported']) {
    await prisma.productBrand.upsert({ where: { name }, update: {}, create: { name } });
  }

  const categories = await prisma.productCategory.findMany();
  const catByName = Object.fromEntries(categories.map((c) => [c.name, c.id]));
  const brands = await prisma.productBrand.findMany();
  const brandByName = Object.fromEntries(brands.map((b) => [b.name, b.id]));

  // 3. Fix types on previously seeded raw-ish products that defaulted to FINISHED_GOOD
  const typeFixes: Array<{ sku: string; type: ProductType }> = [
    { sku: 'HIDE-RAW-001', type: 'RAW_MATERIAL' },
    { sku: 'CHEM-CRM-010', type: 'RAW_MATERIAL' },
    { sku: 'CHEM-DYE-020', type: 'RAW_MATERIAL' },
    { sku: 'ACC-BCK-001',  type: 'RAW_MATERIAL' },
    { sku: 'ACC-THR-001',  type: 'RAW_MATERIAL' },
    { sku: 'PKG-BOX-L',    type: 'CONSUMABLE' },
  ];
  for (const f of typeFixes) {
    await prisma.product.updateMany({ where: { sku: f.sku }, data: { type: f.type } });
  }
  console.log(`  ✓ Corrected types on ${typeFixes.length} existing products`);

  // 4. New raw materials + consumables + WIP
  const products: Seed[] = [
    // Raw hides
    { sku: 'HIDE-RAW-002', barcode: '8900000100012', name: 'Raw Cow Hide (large)',        category: 'Raw Hides',        brand: 'Generic',  cost: 1400, sell: 0, unit: 'PCS', type: 'RAW_MATERIAL', qty: 25, reorder: 15 },
    { sku: 'HIDE-RAW-003', barcode: '8900000100029', name: 'Raw Buffalo Hide',            category: 'Raw Hides',        brand: 'Generic',  cost: 1700, sell: 0, unit: 'PCS', type: 'RAW_MATERIAL', qty: 12, reorder: 10 },
    { sku: 'HIDE-RAW-004', barcode: '8900000100036', name: 'Raw Goat Skin',               category: 'Raw Hides',        brand: 'Generic',  cost: 450,  sell: 0, unit: 'PCS', type: 'RAW_MATERIAL', qty: 80, reorder: 40 },
    { sku: 'HIDE-RAW-005', barcode: '8900000100043', name: 'Raw Sheep Skin',              category: 'Raw Hides',        brand: 'Generic',  cost: 380,  sell: 0, unit: 'PCS', type: 'RAW_MATERIAL', qty: 60, reorder: 30 },

    // Chemicals / tanning
    { sku: 'CHEM-VEG-011', barcode: '8900000100050', name: 'Vegetable Tanning Extract 25kg', category: 'Chemicals',    brand: 'Imported', cost: 2800, sell: 0, unit: 'KG', type: 'RAW_MATERIAL', qty: 200, reorder: 60 },
    { sku: 'CHEM-SLT-012', barcode: '8900000100067', name: 'Tanning Salt 50kg',            category: 'Chemicals',      brand: 'Generic',  cost: 900,  sell: 0, unit: 'KG', type: 'RAW_MATERIAL', qty: 500, reorder: 100 },
    { sku: 'CHEM-FAT-013', barcode: '8900000100074', name: 'Fatliquor Oil 20L',            category: 'Chemicals',      brand: 'Imported', cost: 2200, sell: 0, unit: 'L',  type: 'RAW_MATERIAL', qty: 80,  reorder: 40 },
    { sku: 'CHEM-LIM-014', barcode: '8900000100081', name: 'Liming Agent 25kg',            category: 'Chemicals',      brand: 'Generic',  cost: 650,  sell: 0, unit: 'KG', type: 'RAW_MATERIAL', qty: 150, reorder: 50 },

    // Dyes & finishes
    { sku: 'DYE-BRN-021',  barcode: '8900000100098', name: 'Brown Leather Dye 5L',         category: 'Dyes & Finishes', brand: 'Imported', cost: 1400, sell: 0, unit: 'L',  type: 'RAW_MATERIAL', qty: 30, reorder: 15 },
    { sku: 'DYE-TAN-022',  barcode: '8900000100104', name: 'Tan Leather Dye 5L',           category: 'Dyes & Finishes', brand: 'Imported', cost: 1350, sell: 0, unit: 'L',  type: 'RAW_MATERIAL', qty: 18, reorder: 15 },
    { sku: 'FIN-WAX-030',  barcode: '8900000100111', name: 'Leather Finishing Wax 1kg',    category: 'Dyes & Finishes', brand: 'Imported', cost: 850,  sell: 0, unit: 'KG', type: 'RAW_MATERIAL', qty: 40, reorder: 20 },
    { sku: 'FIN-LAC-031',  barcode: '8900000100128', name: 'Top-coat Lacquer 10L',         category: 'Dyes & Finishes', brand: 'Imported', cost: 3600, sell: 0, unit: 'L',  type: 'RAW_MATERIAL', qty: 22, reorder: 10 },

    // Adhesives
    { sku: 'ADH-LTX-040',  barcode: '8900000100135', name: 'Latex Adhesive 5kg',           category: 'Adhesives',       brand: 'Generic',  cost: 1100, sell: 0, unit: 'KG', type: 'RAW_MATERIAL', qty: 60, reorder: 25 },
    { sku: 'ADH-NEO-041',  barcode: '8900000100142', name: 'Neoprene Cement 5L',           category: 'Adhesives',       brand: 'Imported', cost: 2400, sell: 0, unit: 'L',  type: 'RAW_MATERIAL', qty: 35, reorder: 15 },

    // Hardware / accessories (raw inputs)
    { sku: 'HW-RVT-050',   barcode: '8900000100159', name: 'Brass Rivets (pack of 500)',   category: 'Hardware',        brand: 'Generic',  cost: 320,  sell: 0, unit: 'BOX', type: 'RAW_MATERIAL', qty: 120, reorder: 30 },
    { sku: 'HW-ZIP-051',   barcode: '8900000100166', name: 'YKK Zipper 60cm',              category: 'Hardware',        brand: 'Imported', cost: 65,   sell: 0, unit: 'PCS', type: 'RAW_MATERIAL', qty: 900, reorder: 300 },
    { sku: 'HW-SNP-052',   barcode: '8900000100173', name: 'Snap Button (silver)',         category: 'Hardware',        brand: 'Generic',  cost: 18,   sell: 0, unit: 'PCS', type: 'RAW_MATERIAL', qty: 3500, reorder: 800 },
    { sku: 'HW-DRG-053',   barcode: '8900000100180', name: 'D-ring (gunmetal)',            category: 'Hardware',        brand: 'Generic',  cost: 28,   sell: 0, unit: 'PCS', type: 'RAW_MATERIAL', qty: 1800, reorder: 500 },

    // Tools & consumables (other)
    { sku: 'TOOL-BLD-060', barcode: '8900000100197', name: 'Cutting Blade (pack of 10)',   category: 'Tools & Consumables', brand: 'Generic', cost: 220, sell: 0, unit: 'BOX', type: 'CONSUMABLE', qty: 45, reorder: 20 },
    { sku: 'TOOL-NDL-061', barcode: '8900000100203', name: 'Industrial Sewing Needles',    category: 'Tools & Consumables', brand: 'Imported', cost: 480, sell: 0, unit: 'BOX', type: 'CONSUMABLE', qty: 30, reorder: 15 },
    { sku: 'CON-GLV-062',  barcode: '8900000100210', name: 'Nitrile Gloves (box of 100)',  category: 'Tools & Consumables', brand: 'Generic',  cost: 550,  sell: 0, unit: 'BOX', type: 'CONSUMABLE', qty: 80, reorder: 30 },
    { sku: 'CON-MSK-063',  barcode: '8900000100227', name: 'Dust Mask (pack of 50)',       category: 'Tools & Consumables', brand: 'Generic',  cost: 420,  sell: 0, unit: 'BOX', type: 'CONSUMABLE', qty: 55, reorder: 25 },

    // Packaging
    { sku: 'PKG-BOX-M',    barcode: '8900000100234', name: 'Shipping Box — Medium',        category: 'Packaging',       brand: 'Generic',  cost: 32,  sell: 0, unit: 'BOX', type: 'CONSUMABLE', qty: 600, reorder: 150 },
    { sku: 'PKG-BOX-S',    barcode: '8900000100241', name: 'Shipping Box — Small',         category: 'Packaging',       brand: 'Generic',  cost: 22,  sell: 0, unit: 'BOX', type: 'CONSUMABLE', qty: 800, reorder: 200 },
    { sku: 'PKG-WRAP-070', barcode: '8900000100258', name: 'Bubble Wrap Roll 50m',         category: 'Packaging',       brand: 'Generic',  cost: 680, sell: 0, unit: 'PACK', type: 'CONSUMABLE', qty: 30, reorder: 10 },
    { sku: 'PKG-TAP-071',  barcode: '8900000100265', name: 'Packing Tape 100m',            category: 'Packaging',       brand: 'Generic',  cost: 95,  sell: 0, unit: 'PCS', type: 'CONSUMABLE', qty: 220, reorder: 60 },

    // Work in progress (partially processed)
    { sku: 'WIP-CRUST-001', barcode: '8900000100272', name: 'Crust Leather (pre-finish)',  category: 'Work in Progress', brand: 'Annex',   cost: 1400, sell: 0, unit: 'M2',  type: 'WORK_IN_PROGRESS', qty: 55, reorder: 20 },
    { sku: 'WIP-WET-002',   barcode: '8900000100289', name: 'Wet-blue Leather',            category: 'Work in Progress', brand: 'Annex',   cost: 1100, sell: 0, unit: 'M2',  type: 'WORK_IN_PROGRESS', qty: 70, reorder: 20 },
    { sku: 'WIP-CUT-003',   barcode: '8900000100296', name: 'Cut Leather Panels (bag set)', category: 'Work in Progress', brand: 'Annex',  cost: 950,  sell: 0, unit: 'PCS', type: 'WORK_IN_PROGRESS', qty: 120, reorder: 40 },
  ];

  let created = 0;
  let openingAdded = 0;

  for (const p of products) {
    const catId = catByName[p.category];
    const brandId = brandByName[p.brand];
    if (!catId || !brandId) {
      console.warn(`  ⚠ skipping ${p.sku} — missing category/brand mapping`);
      continue;
    }

    const product = await prisma.product.upsert({
      where: { sku: p.sku },
      update: { type: p.type, reorderLevel: D(p.reorder) },
      create: {
        sku: p.sku,
        barcode: p.barcode,
        name: p.name,
        categoryId: catId,
        brandId: brandId,
        costPrice: D(p.cost),
        sellPrice: D(p.sell),
        reorderLevel: D(p.reorder),
        unit: p.unit,
        type: p.type,
      },
    });
    created++;

    const hasOpening = await prisma.inventoryLedger.findFirst({
      where: { productId: product.id, refType: 'OPENING_STOCK' },
    });
    if (!hasOpening && p.qty > 0) {
      await prisma.inventoryLedger.create({
        data: {
          branchId: branch.id,
          warehouseId: warehouse.id,
          productId: product.id,
          direction: 'IN',
          quantity: D(p.qty),
          costPerUnit: D(p.cost),
          refType: 'OPENING_STOCK',
          note: 'Raw material opening balance',
        },
      });
      openingAdded++;
    }
  }
  console.log(`  ✓ ${created} products upserted, ${openingAdded} opening-stock rows added`);
  console.log('✅ Raw materials seed complete');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

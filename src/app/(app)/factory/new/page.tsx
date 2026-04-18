import { PageHeader } from '@/components/shared/page-header';
import { prisma } from '@/server/db';
import { ProductionOrderForm } from '../production-order-form';

export const metadata = { title: 'New production order' };

export default async function NewProductionOrderPage() {
  const [branches, products, warehouses] = await Promise.all([
    prisma.branch.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, code: true },
    }),
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, sku: true, name: true, unit: true, type: true },
    }),
    prisma.warehouse.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, code: true, name: true, branchId: true },
    }),
  ]);

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader
        title="New Production Order"
        description="Plan a production run — set target output, materials, and stages"
      />
      <ProductionOrderForm branches={branches} products={products} warehouses={warehouses} />
    </div>
  );
}

import { getSession } from '@/server/auth/session';
import { warehouseService } from '@/server/services/warehouse.service';
import { stockService } from '@/server/services/stock.service';
import { prisma } from '@/server/db';
import { PageHeader } from '@/components/shared/page-header';
import { PhysicalCountForm } from '@/components/shared/physical-count-form';
import { Card } from '@/components/ui/card';

export const metadata = { title: 'Physical stock count' };

export default async function CountPage() {
  const session = await getSession();
  const branchId = session?.activeBranchId;
  if (!branchId) {
    return (
      <div>
        <PageHeader title="Physical stock count" />
        <Card className="p-6 text-sm text-muted-foreground">
          Select an active branch from the topbar first.
        </Card>
      </div>
    );
  }

  const [warehouses, products, balances] = await Promise.all([
    warehouseService.listActiveForBranch(session, branchId),
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, sku: true, barcode: true, name: true, unit: true },
    }),
    stockService.balanceSnapshot(session, branchId),
  ]);

  // Pick balances for the first warehouse by default; the form shows balance per
  // product across all warehouses aggregated — for the initial pass we index by
  // product using the selected warehouse's balances only.
  const primary = warehouses[0]?.id;
  const balanceByProduct: Record<string, string> = {};
  for (const b of balances) {
    if (b.warehouseId === primary) balanceByProduct[b.productId] = b.balance.toString();
  }

  return (
    <div>
      <PageHeader
        title="Physical stock count"
        description="Scan items, enter counted quantities, and let the system post variance adjustments."
      />
      <PhysicalCountForm
        branchId={branchId}
        warehouses={warehouses.map((w) => ({ id: w.id, name: w.name, code: w.code }))}
        products={products}
        balanceByProduct={balanceByProduct}
      />
    </div>
  );
}

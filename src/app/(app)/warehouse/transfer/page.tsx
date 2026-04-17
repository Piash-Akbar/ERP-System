import { getSession } from '@/server/auth/session';
import { warehouseService } from '@/server/services/warehouse.service';
import { prisma } from '@/server/db';
import { postTransferAction } from '@/server/actions/stock';
import { PageHeader } from '@/components/shared/page-header';
import { StockMovementForm } from '@/components/shared/stock-movement-form';
import { Card } from '@/components/ui/card';

export const metadata = { title: 'Stock transfer' };

export default async function TransferPage() {
  const session = await getSession();
  const branchId = session?.activeBranchId;
  if (!branchId) {
    return (
      <div>
        <PageHeader title="Stock transfer" />
        <Card className="p-6 text-sm text-muted-foreground">
          Select an active branch from the topbar first.
        </Card>
      </div>
    );
  }

  const [warehouses, products] = await Promise.all([
    warehouseService.listActiveForBranch(session, branchId),
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        sku: true,
        barcode: true,
        name: true,
        unit: true,
        costPrice: true,
        sellPrice: true,
      },
    }),
  ]);

  if (warehouses.length < 2) {
    return (
      <div>
        <PageHeader title="Stock transfer" />
        <Card className="p-6 text-sm text-muted-foreground">
          You need at least two warehouses on this branch to transfer stock.
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Stock transfer"
        description="Move stock between two warehouses in this branch."
      />
      <StockMovementForm
        mode="transfer"
        branchId={branchId}
        warehouses={warehouses.map((w) => ({ id: w.id, name: w.name, code: w.code }))}
        products={products.map((p) => ({
          id: p.id,
          sku: p.sku,
          barcode: p.barcode,
          name: p.name,
          unit: p.unit,
          costPrice: p.costPrice.toString(),
          sellPrice: p.sellPrice.toString(),
        }))}
        action={postTransferAction}
        submitLabel="Post transfer"
        showCost={false}
      />
    </div>
  );
}

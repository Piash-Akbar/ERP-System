import { getSession } from '@/server/auth/session';
import { warehouseService } from '@/server/services/warehouse.service';
import { prisma } from '@/server/db';
import { postIssueAction } from '@/server/actions/stock';
import { PageHeader } from '@/components/shared/page-header';
import { StockMovementForm } from '@/components/shared/stock-movement-form';
import { Card } from '@/components/ui/card';

export const metadata = { title: 'Goods issue' };

export default async function IssuePage() {
  const session = await getSession();
  const branchId = session?.activeBranchId;
  if (!branchId) {
    return (
      <div>
        <PageHeader title="Goods issue" />
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

  return (
    <div>
      <PageHeader
        title="Goods issue"
        description="Scan or type SKU / barcode to issue items from the warehouse."
      />
      <StockMovementForm
        mode="issue"
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
        action={postIssueAction}
        submitLabel="Post issue"
        showCost={false}
      />
    </div>
  );
}

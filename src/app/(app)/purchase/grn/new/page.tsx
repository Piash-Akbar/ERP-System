import Link from 'next/link';
import { PageHeader } from '@/components/shared/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/shared/data-table';
import { AlertBanner } from '@/components/shared/alert-banner';
import { GrnForm } from '../grn-form';
import { prisma } from '@/server/db';

export const metadata = { title: 'Receive goods' };

export default async function NewGrnPage({
  searchParams,
}: {
  searchParams: Promise<{ purchaseOrderId?: string }>;
}) {
  const sp = await searchParams;

  if (!sp.purchaseOrderId) {
    const openPOs = await prisma.purchaseOrder.findMany({
      where: { status: { in: ['APPROVED', 'PARTIALLY_RECEIVED'] } },
      orderBy: { createdAt: 'desc' },
      include: { supplier: { select: { name: true, code: true } } },
    });

    return (
      <div className="space-y-6">
        <PageHeader
          title="Receive Goods"
          description="Pick an open purchase order to receive against"
        />
        <AlertBanner tone="warning" title="Golden Rule">
          No inventory can enter the system without a GRN.
        </AlertBanner>
        <Card className="p-0">
          <div className="px-4 py-3 border-b text-sm font-medium">Open Purchase Orders</div>
          <DataTable
            rows={openPOs}
            rowKey={(r) => r.id}
            empty="No open POs awaiting receipt"
            columns={[
              {
                key: 'number',
                header: 'PO #',
                cell: (r) => <span className="tabular">{r.number}</span>,
              },
              { key: 'supplier', header: 'Supplier', cell: (r) => r.supplier.name },
              { key: 'status', header: 'Status', cell: (r) => r.status.replace('_', ' ').toLowerCase() },
              {
                key: 'action',
                header: '',
                align: 'right',
                cell: (r) => (
                  <Button size="sm" variant="dark" asChild>
                    <Link href={`/purchase/grn/new?purchaseOrderId=${r.id}`}>Receive</Link>
                  </Button>
                ),
              },
            ]}
          />
        </Card>
      </div>
    );
  }

  const po = await prisma.purchaseOrder.findUnique({
    where: { id: sp.purchaseOrderId },
    include: {
      items: { include: { product: true } },
      supplier: true,
    },
  });
  if (!po) return <p className="text-sm text-muted-foreground">Purchase order not found.</p>;

  const warehouses = await prisma.warehouse.findMany({
    where: { branchId: po.branchId, isActive: true },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, code: true },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Receive Goods"
        description={`Against PO ${po.number} — ${po.supplier.name}`}
      />
      <AlertBanner tone="warning" title="Golden Rule">
        Goods are posted into inventory only after a GRN is completed.
      </AlertBanner>
      <GrnForm
        purchaseOrder={{
          id: po.id,
          number: po.number,
          supplierName: po.supplier.name,
          branchId: po.branchId,
        }}
        warehouses={warehouses}
        lines={po.items.map((i) => ({
          id: i.id,
          productId: i.productId,
          productSku: i.product.sku,
          productName: i.product.name,
          unit: i.unit,
          orderedQty: i.orderedQty.toString(),
          receivedQty: i.receivedQty.toString(),
          unitPrice: i.unitPrice.toString(),
        }))}
      />
    </div>
  );
}

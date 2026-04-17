import { PageHeader } from '@/components/shared/page-header';
import { InvoiceForm } from '../invoice-form';
import { prisma } from '@/server/db';
import type { CurrencyCode } from '@/lib/money';

export const metadata = { title: 'New purchase invoice' };

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ purchaseOrderId?: string; grnId?: string }>;
}) {
  const sp = await searchParams;
  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { sku: 'asc' },
    select: { id: true, sku: true, name: true, unit: true },
  });

  if (!sp.purchaseOrderId) {
    // Without a PO we need supplier selection; simplest MVP: redirect to picking from POs.
    const pos = await prisma.purchaseOrder.findMany({
      where: { status: { in: ['APPROVED', 'PARTIALLY_RECEIVED', 'COMPLETED'] } },
      orderBy: { createdAt: 'desc' },
      include: { supplier: true },
    });
    return (
      <div className="space-y-6">
        <PageHeader
          title="Create Purchase Invoice"
          description="Pick a purchase order to bill against"
        />
        <ul className="space-y-2">
          {pos.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No approved purchase orders available to invoice.
            </p>
          )}
          {pos.map((po) => (
            <li
              key={po.id}
              className="flex items-center justify-between border rounded-md p-3 bg-background"
            >
              <div>
                <p className="font-medium tabular">{po.number}</p>
                <p className="text-xs text-muted-foreground">
                  {po.supplier.name} · {po.status.replace('_', ' ').toLowerCase()}
                </p>
              </div>
              <a
                href={`/purchase/invoices/new?purchaseOrderId=${po.id}`}
                className="text-sm text-blue-600 hover:underline"
              >
                Create invoice →
              </a>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const po = await prisma.purchaseOrder.findUnique({
    where: { id: sp.purchaseOrderId },
    include: { supplier: true, items: { include: { product: true } } },
  });
  if (!po) return <p className="text-sm text-muted-foreground">Purchase order not found.</p>;

  const grn = sp.grnId
    ? await prisma.goodsReceiving.findUnique({
        where: { id: sp.grnId },
        include: { items: { include: { product: true } } },
      })
    : null;

  const prefillSource = grn ? grn.items : po.items;
  const prefillItems = prefillSource.map((i) => ({
    productId: i.productId,
    description: '',
    unit: grn ? (po.items.find((p) => p.id === (i as { purchaseOrderItemId?: string }).purchaseOrderItemId)?.unit ?? 'PCS') : (i as { unit: string }).unit,
    quantity: (grn ? (i as { receivedQty: { toString: () => string } }).receivedQty : (i as { orderedQty: { toString: () => string } }).orderedQty).toString(),
    unitPrice: (grn
      ? (i as { unitCost: { toString: () => string } }).unitCost
      : (i as { unitPrice: { toString: () => string } }).unitPrice
    ).toString(),
    taxRate: grn
      ? (po.items.find((p) => p.id === (i as { purchaseOrderItemId?: string }).purchaseOrderItemId)?.taxRate.toString() ?? '0')
      : (i as { taxRate: { toString: () => string } }).taxRate.toString(),
  }));

  return (
    <div className="space-y-6 max-w-6xl">
      <PageHeader
        title="Create Purchase Invoice"
        description={`${po.supplier.name} · PO ${po.number}${grn ? ` · GRN ${grn.number}` : ''}`}
      />
      <InvoiceForm
        branchId={po.branchId}
        supplierId={po.supplierId}
        supplierName={po.supplier.name}
        purchaseOrderId={po.id}
        purchaseOrderNumber={po.number}
        grnId={grn?.id}
        grnNumber={grn?.number}
        currency={po.currency as CurrencyCode}
        prefillItems={prefillItems}
        products={products}
      />
    </div>
  );
}

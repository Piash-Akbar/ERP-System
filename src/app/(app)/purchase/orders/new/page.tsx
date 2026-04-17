import { PageHeader } from '@/components/shared/page-header';
import { POForm } from '../po-form';
import { prisma } from '@/server/db';

export const metadata = { title: 'New Purchase Order' };

export default async function NewPurchaseOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ requisitionId?: string }>;
}) {
  const sp = await searchParams;
  const [branches, suppliers, products, requisition] = await Promise.all([
    prisma.branch.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, code: true, currency: true },
    }),
    prisma.supplier.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { name: 'asc' },
      select: { id: true, code: true, name: true, currency: true },
    }),
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: { sku: 'asc' },
      select: { id: true, sku: true, name: true, unit: true, costPrice: true },
    }),
    sp.requisitionId
      ? prisma.purchaseRequisition.findUnique({
          where: { id: sp.requisitionId },
          include: { items: true },
        })
      : Promise.resolve(null),
  ]);

  const prefill =
    requisition && requisition.status === 'APPROVED'
      ? {
          requisitionId: requisition.id,
          branchId: requisition.branchId,
          items: requisition.items.map((i) => ({
            productName: i.productName,
            unit: i.unit,
            quantity: i.quantity.toString(),
          })),
        }
      : undefined;

  return (
    <div className="space-y-6 max-w-6xl">
      <PageHeader
        title="Create Purchase Order"
        description={
          prefill ? `From requisition ${requisition?.number}` : 'Commit an order with a supplier'
        }
      />
      <POForm
        branches={branches}
        suppliers={suppliers}
        products={products.map((p) => ({
          id: p.id,
          sku: p.sku,
          name: p.name,
          unit: p.unit,
          costPrice: p.costPrice.toString(),
        }))}
        prefill={prefill}
      />
    </div>
  );
}

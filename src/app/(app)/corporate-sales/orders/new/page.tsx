import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/shared/page-header';
import { Card } from '@/components/ui/card';
import { getSession } from '@/server/auth/session';
import { prisma } from '@/server/db';
import { OrderBuilder } from './builder';

export const metadata = { title: 'New Order' };

export default async function NewOrderPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  const branchId = session.activeBranchId;
  if (!branchId) {
    return (
      <div className="space-y-4">
        <PageHeader title="New order" description="Select an active branch first." />
        <Card className="p-6 text-sm">Pick a branch from the switcher to continue.</Card>
      </div>
    );
  }

  const [branch, warehouses, customers, products] = await Promise.all([
    prisma.branch.findUnique({ where: { id: branchId }, select: { id: true, name: true, currency: true } }),
    prisma.warehouse.findMany({
      where: { branchId, isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, code: true },
    }),
    prisma.customer.findMany({
      where: { branchId, status: 'ACTIVE' },
      orderBy: { name: 'asc' },
      take: 500,
      select: { id: true, code: true, name: true, type: true, currency: true },
    }),
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      take: 40,
      select: { id: true, sku: true, barcode: true, name: true, unit: true, sellPrice: true, taxRate: true, imageUrl: true },
    }),
  ]);
  if (!branch) redirect('/corporate-sales');

  return (
    <div className="space-y-6">
      <PageHeader title="New order" description={`${branch.name} · ${branch.currency}`} />
      <OrderBuilder
        branch={branch}
        warehouses={warehouses}
        customers={customers}
        initialProducts={products.map((p) => ({
          id: p.id,
          sku: p.sku,
          barcode: p.barcode,
          name: p.name,
          unit: p.unit,
          sellPrice: p.sellPrice.toString(),
          taxRate: p.taxRate.toString(),
          imageUrl: p.imageUrl,
        }))}
      />
    </div>
  );
}

import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/shared/page-header';
import { Card } from '@/components/ui/card';
import { getSession } from '@/server/auth/session';
import { prisma } from '@/server/db';
import { QuoteBuilder } from './builder';

export const metadata = { title: 'New Quote' };

export default async function NewQuotePage() {
  const session = await getSession();
  if (!session) redirect('/login');
  const branchId = session.activeBranchId;
  if (!branchId) {
    return (
      <div className="space-y-4">
        <PageHeader title="New quote" description="Select an active branch first." />
        <Card className="p-6 text-sm">Pick a branch from the switcher to continue.</Card>
      </div>
    );
  }

  const [branch, customers, products] = await Promise.all([
    prisma.branch.findUnique({
      where: { id: branchId },
      select: { id: true, name: true, currency: true },
    }),
    prisma.customer.findMany({
      where: { branchId, status: 'ACTIVE' },
      orderBy: { name: 'asc' },
      take: 500,
      select: { id: true, code: true, name: true, type: true, creditLimit: true, currency: true },
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
      <PageHeader title="New quote" description={`${branch.name} · ${branch.currency}`} />
      <QuoteBuilder
        branch={branch}
        customers={customers.map((c) => ({
          id: c.id,
          code: c.code,
          name: c.name,
          type: c.type,
          creditLimit: c.creditLimit.toString(),
          currency: c.currency,
        }))}
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

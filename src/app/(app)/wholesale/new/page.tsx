import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/shared/page-header';
import { Card } from '@/components/ui/card';
import { getSession } from '@/server/auth/session';
import { prisma } from '@/server/db';
import { wholesaleService } from '@/server/services/wholesale.service';
import { InvoiceBuilder } from './builder';

export const metadata = { title: 'New Wholesale Invoice' };

export default async function NewWholesaleInvoicePage() {
  const session = await getSession();
  if (!session) redirect('/login');
  const branchId = session.activeBranchId;
  if (!branchId) {
    return (
      <div className="space-y-4">
        <PageHeader title="New wholesale invoice" description="Pick an active branch first." />
        <Card className="p-6 text-sm">Select an active branch from the switcher to continue.</Card>
      </div>
    );
  }

  const [branch, warehouses, customers, initialProducts] = await Promise.all([
    prisma.branch.findUnique({
      where: { id: branchId },
      select: { id: true, name: true, code: true, currency: true },
    }),
    prisma.warehouse.findMany({
      where: { branchId, isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, code: true, type: true },
    }),
    prisma.customer.findMany({
      where: { branchId, status: 'ACTIVE' },
      orderBy: { name: 'asc' },
      take: 500,
      select: { id: true, code: true, name: true, type: true, creditLimit: true, creditDays: true },
    }),
    wholesaleService.searchProducts(session, '', 40),
  ]);

  if (!branch) {
    return (
      <div className="space-y-4">
        <PageHeader title="New wholesale invoice" />
        <Card className="p-6 text-sm text-red-600">Active branch not found.</Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="New wholesale invoice"
        description={`${branch.name} · ${branch.currency}`}
      />
      <InvoiceBuilder
        branch={branch}
        warehouses={warehouses}
        customers={customers.map((c) => ({
          id: c.id,
          code: c.code,
          name: c.name,
          type: c.type,
          creditLimit: c.creditLimit.toString(),
          creditDays: c.creditDays,
        }))}
        initialProducts={initialProducts.map((p) => ({
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

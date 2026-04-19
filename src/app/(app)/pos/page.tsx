import Link from 'next/link';
import { redirect } from 'next/navigation';
import { PlayCircle, Receipt } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getSession } from '@/server/auth/session';
import { prisma } from '@/server/db';
import { posService } from '@/server/services/pos.service';
import { PosTerminal } from './terminal';

export const metadata = { title: 'POS Terminal' };

export default async function PosPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const openSession = await prisma.posSession.findFirst({
    where: { cashierId: session.userId, status: 'OPEN' },
    include: {
      branch: { select: { id: true, name: true, code: true, currency: true } },
      warehouse: { select: { id: true, name: true, code: true } },
    },
    orderBy: { openedAt: 'desc' },
  });

  if (!openSession) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="POS Terminal"
          description="Open a cash session to start selling."
        />
        <Card className="p-8 max-w-xl">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-blue-50 p-3">
              <PlayCircle className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-lg">No open session</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Cash sessions track opening balance, cash tendered, and end-of-day
                variance. Open one to begin checkout.
              </p>
              <div className="flex gap-2 mt-4">
                <Button variant="dark" asChild>
                  <Link href="/pos/open">Open session</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/pos/sessions">
                    <Receipt className="h-4 w-4" />
                    Session history
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const initialProducts = await posService.searchProducts(session, openSession.branchId, '', 40);
  const customers = await prisma.customer.findMany({
    where: { branchId: openSession.branchId, status: 'ACTIVE' },
    orderBy: { name: 'asc' },
    take: 500,
    select: { id: true, code: true, name: true, type: true, creditLimit: true },
  });

  return (
    <PosTerminal
      session={{
        id: openSession.id,
        branchId: openSession.branchId,
        warehouseId: openSession.warehouseId,
        branchName: openSession.branch.name,
        warehouseName: openSession.warehouse.name,
        currency: openSession.branch.currency,
        cashierName: session.name,
        openedAt: openSession.openedAt.toISOString(),
      }}
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
      customers={customers.map((c) => ({
        id: c.id,
        code: c.code,
        name: c.name,
        type: c.type,
        creditLimit: c.creditLimit.toString(),
      }))}
    />
  );
}

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/shared/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { prisma } from '@/server/db';
import { getSession } from '@/server/auth/session';
import { openPosSessionAction } from '@/server/actions/pos';

export const metadata = { title: 'Open POS Session' };

export default async function OpenSessionPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const existing = await prisma.posSession.findFirst({
    where: { cashierId: session.userId, status: 'OPEN' },
  });
  if (existing) redirect('/pos');

  const branches = await prisma.branch.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, code: true, currency: true },
  });
  const warehouses = await prisma.warehouse.findMany({
    where: { isActive: true, type: { in: ['STORE', 'SHOWROOM', 'MAIN'] } },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, code: true, branchId: true },
  });

  const defaultBranch = session.activeBranchId ?? branches[0]?.id ?? '';

  const lastClosed = await prisma.posSession.findFirst({
    where: { cashierId: session.userId, status: 'CLOSED' },
    orderBy: { closedAt: 'desc' },
    select: { countedCash: true },
  });
  const defaultOpeningBalance = lastClosed ? lastClosed.countedCash.toString() : '0';

  return (
    <div className="space-y-6">
      <PageHeader title="Open Cash Session" description="Record the opening balance to start selling." />
      <Card className="p-6 max-w-xl">
        <form action={async (fd) => { 'use server'; await openPosSessionAction(fd); }} className="space-y-4">
          <div>
            <Label htmlFor="branchId">Branch</Label>
            <select
              id="branchId"
              name="branchId"
              defaultValue={defaultBranch}
              className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              required
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.code} — {b.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="warehouseId">Till / Warehouse</Label>
            <select
              id="warehouseId"
              name="warehouseId"
              className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              required
            >
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.code} — {w.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="openingFloat">Opening balance</Label>
            <Input
              id="openingFloat"
              name="openingFloat"
              type="number"
              min={0}
              step="any"
              defaultValue={defaultOpeningBalance}
            />
            {lastClosed && (
              <p className="text-xs text-muted-foreground mt-1">
                Carried from previous session&apos;s counted cash.
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Input id="notes" name="notes" placeholder="Optional" />
          </div>
          <div className="flex gap-2">
            <Button type="submit" variant="dark">Open session</Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/pos">Cancel</Link>
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

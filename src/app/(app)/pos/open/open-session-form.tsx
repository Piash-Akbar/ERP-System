'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/shared/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { openPosSessionAction } from '@/server/actions/pos';

interface Branch {
  id: string;
  name: string;
  code: string;
  currency: string;
}

interface Warehouse {
  id: string;
  name: string;
  code: string;
  branchId: string;
}

interface Props {
  branches: Branch[];
  warehouses: Warehouse[];
  defaultBranch: string;
  defaultOpeningBalance: string;
  carriedFromPrevious: boolean;
}

export function OpenSessionForm({
  branches,
  warehouses,
  defaultBranch,
  defaultOpeningBalance,
  carriedFromPrevious,
}: Props) {
  const [state, action, pending] = useActionState(openPosSessionAction, undefined);
  const [selectedBranch, setSelectedBranch] = useState(defaultBranch);

  const filteredWarehouses = warehouses.filter((w) => w.branchId === selectedBranch);

  return (
    <div className="space-y-6">
      <PageHeader title="Open Cash Session" description="Record the opening balance to start selling." />
      <Card className="p-6 max-w-xl">
        {state?.error && (
          <div className="mb-4 rounded-md bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
            {state.error}
          </div>
        )}
        <form action={action} className="space-y-4">
          <div>
            <Label htmlFor="branchId">Branch</Label>
            <select
              id="branchId"
              name="branchId"
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              required
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.code} — {b.name}
                </option>
              ))}
            </select>
            {state?.fieldErrors?.branchId && (
              <p className="text-xs text-destructive mt-1">{state.fieldErrors.branchId[0]}</p>
            )}
          </div>
          <div>
            <Label htmlFor="warehouseId">Till / Warehouse</Label>
            {filteredWarehouses.length === 0 ? (
              <p className="mt-1 text-sm text-muted-foreground">
                No MAIN / STORE / SHOWROOM warehouses found for this branch.
              </p>
            ) : (
              <select
                id="warehouseId"
                name="warehouseId"
                className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                required
              >
                {filteredWarehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.code} — {w.name}
                  </option>
                ))}
              </select>
            )}
            {state?.fieldErrors?.warehouseId && (
              <p className="text-xs text-destructive mt-1">{state.fieldErrors.warehouseId[0]}</p>
            )}
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
            {carriedFromPrevious && (
              <p className="text-xs text-muted-foreground mt-1">
                Carried from previous session&apos;s counted cash.
              </p>
            )}
            {state?.fieldErrors?.openingFloat && (
              <p className="text-xs text-destructive mt-1">{state.fieldErrors.openingFloat[0]}</p>
            )}
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Input id="notes" name="notes" placeholder="Optional" />
          </div>
          <div className="flex gap-2">
            <Button type="submit" variant="dark" disabled={pending || filteredWarehouses.length === 0}>
              {pending ? 'Opening…' : 'Open session'}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/pos">Cancel</Link>
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

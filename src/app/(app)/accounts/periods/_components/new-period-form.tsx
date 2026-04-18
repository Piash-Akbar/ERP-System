'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createPeriodAction, type PeriodFormState } from '@/server/actions/accounts';

interface Props {
  branches: { id: string; code: string; name: string }[];
}

export function NewPeriodForm({ branches }: Props) {
  const [state, formAction, pending] = useActionState<PeriodFormState, FormData>(
    createPeriodAction,
    undefined,
  );
  return (
    <form action={formAction} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
      <div className="space-y-2">
        <Label htmlFor="branchId">Branch</Label>
        <select
          id="branchId"
          name="branchId"
          required
          defaultValue={branches[0]?.id}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
        >
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.code} · {b.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="name">Period name</Label>
        <Input id="name" name="name" placeholder="FY2026-27 Apr" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="startsAt">Starts</Label>
        <Input id="startsAt" name="startsAt" type="date" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="endsAt">Ends</Label>
        <Input id="endsAt" name="endsAt" type="date" required />
      </div>
      <div className="flex flex-col gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? 'Adding…' : 'Add period'}
        </Button>
        {state?.error && <p className="text-xs text-destructive">{state.error}</p>}
        {state?.success && <p className="text-xs text-emerald-600">Period created.</p>}
      </div>
    </form>
  );
}

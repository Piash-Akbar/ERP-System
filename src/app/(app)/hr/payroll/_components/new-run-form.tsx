'use client';

import { useRouter } from 'next/navigation';
import { useActionState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createPayrollRunAction, type FormState } from '@/server/actions/hr';

interface Props {
  branches: { id: string; code: string; name: string }[];
}

function currentPeriod() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function NewPayrollRunForm({ branches }: Props) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<FormState, FormData>(createPayrollRunAction, undefined);

  useEffect(() => {
    if (state?.success && state.id) router.push(`/hr/payroll/${state.id}`);
  }, [state, router]);

  return (
    <form action={formAction} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
      <div className="space-y-2">
        <Label htmlFor="branchId">Branch</Label>
        <select id="branchId" name="branchId" required defaultValue={branches[0]?.id} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm">
          {branches.map((b) => (
            <option key={b.id} value={b.id}>{b.code} · {b.name}</option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="period">Period (YYYY-MM)</Label>
        <Input id="period" name="period" placeholder="2026-04" defaultValue={currentPeriod()} required />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="notes">Notes</Label>
        <Input id="notes" name="notes" placeholder="Optional" />
      </div>
      <div className="flex flex-col gap-1">
        <Button type="submit" disabled={pending}>{pending ? 'Processing…' : 'Generate run'}</Button>
        {state?.error && <p className="text-xs text-destructive">{state.error}</p>}
      </div>
    </form>
  );
}

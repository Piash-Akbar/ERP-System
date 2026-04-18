'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createLeaveAction, type FormState } from '@/server/actions/hr';

interface Props {
  employees: { id: string; code: string; name: string }[];
  types: string[];
}

export function NewLeaveForm({ employees, types }: Props) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(createLeaveAction, undefined);
  return (
    <form action={formAction} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="employeeId">Employee</Label>
        <select id="employeeId" name="employeeId" required className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm">
          {employees.map((e) => (
            <option key={e.id} value={e.id}>{e.code} · {e.name}</option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="type">Type</Label>
        <select id="type" name="type" defaultValue="CASUAL" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm">
          {types.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="fromDate">From</Label>
        <Input id="fromDate" name="fromDate" type="date" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="toDate">To</Label>
        <Input id="toDate" name="toDate" type="date" required />
      </div>
      <div className="space-y-2 md:col-span-5">
        <Label htmlFor="reason">Reason</Label>
        <Input id="reason" name="reason" placeholder="Optional" />
      </div>
      <div className="flex flex-col gap-1">
        <Button type="submit" disabled={pending}>{pending ? 'Submitting…' : 'Submit'}</Button>
        {state?.error && <p className="text-xs text-destructive">{state.error}</p>}
        {state?.success && <p className="text-xs text-emerald-600">Submitted.</p>}
      </div>
    </form>
  );
}

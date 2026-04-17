'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import {
  createWarehouseAction,
  updateWarehouseAction,
  type WarehouseFormState,
} from '@/server/actions/warehouses';

const TYPES = [
  ['MAIN', 'Main'],
  ['STORE', 'Store'],
  ['WIP', 'Work-in-progress'],
  ['QUARANTINE', 'Quarantine'],
  ['DAMAGED', 'Damaged'],
  ['SHOWROOM', 'Showroom'],
] as const;

export interface WarehouseFormProps {
  mode: 'create' | 'edit';
  initial?: {
    id: string;
    branchId: string;
    code: string;
    name: string;
    type: (typeof TYPES)[number][0];
    address: string | null;
    isActive: boolean;
  };
  branches: { id: string; name: string; code: string }[];
}

export function WarehouseForm({ mode, initial, branches }: WarehouseFormProps) {
  const action = mode === 'create' ? createWarehouseAction : updateWarehouseAction;
  const [state, formAction, pending] = useActionState<WarehouseFormState, FormData>(action, undefined);
  const E = (f: string) => state?.fieldErrors?.[f]?.[0];

  return (
    <form action={formAction} className="space-y-6">
      {mode === 'edit' && <input type="hidden" name="id" value={initial?.id} />}

      <Card>
        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="branchId">
              Branch <span className="text-destructive">*</span>
            </Label>
            <select
              id="branchId"
              name="branchId"
              required
              defaultValue={initial?.branchId ?? ''}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            >
              <option value="">— select branch —</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <select
              id="type"
              name="type"
              defaultValue={initial?.type ?? 'MAIN'}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            >
              {TYPES.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="code">
              Code <span className="text-destructive">*</span>
            </Label>
            <Input id="code" name="code" required defaultValue={initial?.code} />
            {E('code') && <p className="text-xs text-destructive">{E('code')}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input id="name" name="name" required defaultValue={initial?.name} />
            {E('name') && <p className="text-xs text-destructive">{E('name')}</p>}
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="address">Address</Label>
            <Textarea id="address" name="address" rows={2} defaultValue={initial?.address ?? ''} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={initial?.isActive ?? true}
              className="h-4 w-4 accent-primary"
            />
            <span className="text-sm">Active</span>
          </label>
        </CardContent>
      </Card>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving…' : mode === 'create' ? 'Create warehouse' : 'Save changes'}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/warehouse">Cancel</Link>
        </Button>
      </div>
    </form>
  );
}

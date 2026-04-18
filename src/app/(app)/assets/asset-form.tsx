'use client';

import { useActionState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  createAssetAction,
  updateAssetAction,
  type AssetFormState,
} from '@/server/actions/assets';
import {
  ASSET_CONDITION,
  ASSET_STATUS,
  DEPRECIATION_METHODS,
} from '@/server/validators/assets';

type Branch = { id: string; name: string; code: string };
type Category = { id: string; name: string };

type AssetDefaults = {
  id?: string;
  branchId?: string;
  categoryId?: string | null;
  name?: string;
  description?: string | null;
  serialNumber?: string | null;
  location?: string | null;
  assignedTo?: string | null;
  condition?: string;
  status?: string;
  purchaseDate?: string;
  purchaseCost?: string;
  salvageValue?: string;
  usefulLifeMonths?: number;
  depreciationMethod?: string;
  notes?: string | null;
};

export function AssetForm({
  mode,
  branches,
  categories,
  defaults,
}: {
  mode: 'create' | 'edit';
  branches: Branch[];
  categories: Category[];
  defaults?: AssetDefaults;
}) {
  const action = mode === 'create' ? createAssetAction : updateAssetAction;
  const [state, submit, pending] = useActionState<AssetFormState, FormData>(action, undefined);
  const fieldErrors = state?.fieldErrors ?? {};

  return (
    <form action={submit} className="space-y-6">
      {defaults?.id && <input type="hidden" name="id" value={defaults.id} />}
      <Card className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Branch *</Label>
          <select
            name="branchId"
            defaultValue={defaults?.branchId ?? branches[0]?.id ?? ''}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.code})
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label>Category</Label>
          <select
            name="categoryId"
            defaultValue={defaults?.categoryId ?? ''}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          >
            <option value="">—</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <Label>Name *</Label>
          <Input name="name" defaultValue={defaults?.name ?? ''} required />
        </div>
        <div className="md:col-span-2">
          <Label>Description</Label>
          <Textarea name="description" defaultValue={defaults?.description ?? ''} rows={2} />
        </div>
        <div>
          <Label>Serial number</Label>
          <Input name="serialNumber" defaultValue={defaults?.serialNumber ?? ''} />
        </div>
        <div>
          <Label>Location</Label>
          <Input name="location" defaultValue={defaults?.location ?? ''} />
        </div>
        <div>
          <Label>Assigned to</Label>
          <Input name="assignedTo" defaultValue={defaults?.assignedTo ?? ''} />
        </div>
        <div>
          <Label>Condition</Label>
          <select
            name="condition"
            defaultValue={defaults?.condition ?? 'GOOD'}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          >
            {ASSET_CONDITION.map((c) => (
              <option key={c} value={c}>
                {c.toLowerCase()}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label>Status</Label>
          <select
            name="status"
            defaultValue={defaults?.status ?? 'IN_USE'}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          >
            {ASSET_STATUS.map((s) => (
              <option key={s} value={s}>
                {s.replace('_', ' ').toLowerCase()}
              </option>
            ))}
          </select>
        </div>
      </Card>

      <Card className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Purchase date *</Label>
          <Input
            type="date"
            name="purchaseDate"
            defaultValue={defaults?.purchaseDate ?? ''}
            required
          />
        </div>
        <div>
          <Label>Purchase cost *</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            name="purchaseCost"
            defaultValue={defaults?.purchaseCost ?? ''}
            required
          />
        </div>
        <div>
          <Label>Salvage value</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            name="salvageValue"
            defaultValue={defaults?.salvageValue ?? '0'}
          />
        </div>
        <div>
          <Label>Useful life (months)</Label>
          <Input
            type="number"
            min="1"
            name="usefulLifeMonths"
            defaultValue={defaults?.usefulLifeMonths ?? 60}
          />
        </div>
        <div className="md:col-span-2">
          <Label>Depreciation method</Label>
          <select
            name="depreciationMethod"
            defaultValue={defaults?.depreciationMethod ?? 'STRAIGHT_LINE'}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          >
            {DEPRECIATION_METHODS.map((m) => (
              <option key={m} value={m}>
                {m.replace('_', ' ').toLowerCase()}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <Label>Notes</Label>
          <Textarea name="notes" defaultValue={defaults?.notes ?? ''} rows={2} />
        </div>
      </Card>

      {state?.error && (
        <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </div>
      )}
      {Object.entries(fieldErrors).map(([k, v]) => (
        <p key={k} className="text-xs text-red-600">
          {k}: {v?.join(', ')}
        </p>
      ))}

      <div className="flex justify-end gap-2">
        <Button type="submit" variant="dark" disabled={pending}>
          {pending ? 'Saving…' : mode === 'create' ? 'Create asset' : 'Save changes'}
        </Button>
      </div>
    </form>
  );
}

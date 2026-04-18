'use client';

import { useActionState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  upsertAssetCategoryAction,
  type AssetFormState,
} from '@/server/actions/assets';
import { DEPRECIATION_METHODS } from '@/server/validators/assets';

export function CategoryForm() {
  const [state, action, pending] = useActionState<AssetFormState, FormData>(
    upsertAssetCategoryAction,
    undefined,
  );
  return (
    <Card className="p-4 space-y-3">
      <h3 className="font-semibold text-sm">Add category</h3>
      <form action={action} className="space-y-3">
        <div>
          <Label>Name *</Label>
          <Input name="name" required />
        </div>
        <div>
          <Label>Description</Label>
          <Textarea name="description" rows={2} />
        </div>
        <div>
          <Label>Depreciation method</Label>
          <select
            name="depreciationMethod"
            defaultValue="STRAIGHT_LINE"
            className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          >
            {DEPRECIATION_METHODS.map((m) => (
              <option key={m} value={m}>
                {m.replace('_', ' ').toLowerCase()}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Life (months)</Label>
            <Input name="defaultLifeMonths" type="number" min="1" defaultValue={60} />
          </div>
          <div>
            <Label>Salvage rate (0-1)</Label>
            <Input
              name="defaultSalvageRate"
              type="number"
              min="0"
              max="1"
              step="0.01"
              defaultValue={0}
            />
          </div>
        </div>
        <Button type="submit" variant="dark" className="w-full" disabled={pending}>
          {pending ? 'Saving…' : 'Save category'}
        </Button>
        {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
        {state?.success && <p className="text-xs text-emerald-600">Saved.</p>}
      </form>
    </Card>
  );
}

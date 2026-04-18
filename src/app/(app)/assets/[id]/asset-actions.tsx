'use client';

import { useActionState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  transferAssetAction,
  disposeAssetAction,
  depreciateAssetAction,
  type AssetFormState,
} from '@/server/actions/assets';

type Branch = { id: string; name: string; code: string };

export function AssetActions({
  asset,
  branches,
}: {
  asset: { id: string; status: string };
  branches: Branch[];
}) {
  const [transferState, transferAction, transferPending] = useActionState<AssetFormState, FormData>(
    transferAssetAction,
    undefined,
  );
  const [disposeState, disposeAction, disposePending] = useActionState<AssetFormState, FormData>(
    disposeAssetAction,
    undefined,
  );
  const [deprState, deprAction, deprPending] = useActionState<AssetFormState, FormData>(
    depreciateAssetAction,
    undefined,
  );

  const disposed = asset.status === 'DISPOSED';

  return (
    <div className="space-y-6">
      <Card className="p-4 space-y-3">
        <h3 className="font-semibold text-sm">Transfer</h3>
        <form action={transferAction} className="space-y-2">
          <input type="hidden" name="assetId" value={asset.id} />
          <div>
            <Label className="text-xs">Target branch</Label>
            <select
              name="toBranchId"
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            >
              <option value="">— keep current —</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-xs">New location</Label>
            <Input name="toLocation" />
          </div>
          <div>
            <Label className="text-xs">New assignee</Label>
            <Input name="toAssignee" />
          </div>
          <div>
            <Label className="text-xs">Note</Label>
            <Textarea name="note" rows={2} />
          </div>
          <Button type="submit" size="sm" variant="outline" className="w-full" disabled={transferPending || disposed}>
            {transferPending ? 'Transferring…' : 'Transfer asset'}
          </Button>
          {transferState?.error && <p className="text-xs text-red-600">{transferState.error}</p>}
          {transferState?.success && <p className="text-xs text-emerald-600">Transferred.</p>}
        </form>
      </Card>

      <Card className="p-4 space-y-3">
        <h3 className="font-semibold text-sm">Depreciation</h3>
        <form action={deprAction} className="space-y-2">
          <input type="hidden" name="assetId" value={asset.id} />
          <div>
            <Label className="text-xs">Period end</Label>
            <Input type="date" name="periodEnd" required />
          </div>
          <Button type="submit" size="sm" variant="outline" className="w-full" disabled={deprPending || disposed}>
            {deprPending ? 'Posting…' : 'Post depreciation'}
          </Button>
          {deprState?.error && <p className="text-xs text-red-600">{deprState.error}</p>}
          {deprState?.success && <p className="text-xs text-emerald-600">Posted.</p>}
        </form>
      </Card>

      <Card className="p-4 space-y-3">
        <h3 className="font-semibold text-sm text-red-600">Dispose</h3>
        <form action={disposeAction} className="space-y-2">
          <input type="hidden" name="assetId" value={asset.id} />
          <div>
            <Label className="text-xs">Disposed on</Label>
            <Input type="date" name="disposedAt" required />
          </div>
          <div>
            <Label className="text-xs">Disposal value</Label>
            <Input type="number" min="0" step="0.01" name="disposalValue" defaultValue="0" />
          </div>
          <div>
            <Label className="text-xs">Reason</Label>
            <Textarea name="disposalReason" rows={2} required />
          </div>
          <Button type="submit" size="sm" variant="destructive" className="w-full" disabled={disposePending || disposed}>
            {disposePending ? 'Disposing…' : disposed ? 'Already disposed' : 'Dispose asset'}
          </Button>
          {disposeState?.error && <p className="text-xs text-red-600">{disposeState.error}</p>}
          {disposeState?.success && <p className="text-xs text-emerald-600">Disposed.</p>}
        </form>
      </Card>
    </div>
  );
}

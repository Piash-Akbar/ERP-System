'use client';

import { useActionState, useTransition } from 'react';
import { Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  linkDocumentAction,
  unlinkDocumentAction,
  type DocumentFormState,
} from '@/server/actions/documents';

export function LinkForm({ documentId }: { documentId: string }) {
  const [state, action, pending] = useActionState<DocumentFormState, FormData>(
    linkDocumentAction,
    undefined,
  );
  return (
    <Card className="p-4 space-y-3">
      <h3 className="font-semibold text-sm">Link to entity</h3>
      <form action={action} className="space-y-3">
        <input type="hidden" name="documentId" value={documentId} />
        <div>
          <Label className="text-xs">Entity type</Label>
          <Input name="entityType" required placeholder="PurchaseOrder" />
        </div>
        <div>
          <Label className="text-xs">Entity ID</Label>
          <Input name="entityId" required placeholder="cuid or number" />
        </div>
        <div>
          <Label className="text-xs">Note</Label>
          <Input name="note" />
        </div>
        <Button type="submit" variant="dark" className="w-full" disabled={pending}>
          {pending ? 'Linking…' : 'Add link'}
        </Button>
        {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
        {state?.success && <p className="text-xs text-emerald-600">Linked.</p>}
      </form>
    </Card>
  );
}

export function UnlinkButton({
  documentId,
  linkId,
}: {
  documentId: string;
  linkId: string;
}) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      className="text-muted-foreground hover:text-red-600 disabled:opacity-50"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await unlinkDocumentAction(documentId, linkId);
        })
      }
      title="Remove link"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}

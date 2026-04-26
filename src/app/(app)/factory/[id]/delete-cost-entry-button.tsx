'use client';

import { useActionState } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { deleteCostEntryAction, type FactoryFormState } from '@/server/actions/factory';

export function DeleteCostEntryButton({
  entryId,
  orderId,
}: {
  entryId: string;
  orderId: string;
}) {
  const [, formAction, pending] = useActionState<FactoryFormState, FormData>(
    deleteCostEntryAction,
    undefined,
  );
  return (
    <form action={formAction}>
      <input type="hidden" name="entryId" value={entryId} />
      <input type="hidden" name="orderId" value={orderId} />
      <Button
        type="submit"
        size="icon"
        variant="ghost"
        className="h-7 w-7 text-muted-foreground hover:text-red-600"
        disabled={pending}
        aria-label="Delete entry"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </form>
  );
}

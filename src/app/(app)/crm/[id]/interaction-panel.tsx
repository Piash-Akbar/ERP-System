'use client';

import { useActionState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Pill } from '@/components/shared/pill';
import {
  addCustomerInteractionAction,
  type InteractionFormState,
} from '@/server/actions/crm';

const TYPES = [
  ['NOTE', 'Note'],
  ['CALL', 'Call'],
  ['EMAIL', 'Email'],
  ['MEETING', 'Meeting'],
  ['COMPLAINT', 'Complaint'],
  ['FOLLOW_UP', 'Follow-up'],
  ['OTHER', 'Other'],
] as const;

const selectClass =
  'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm';

interface Interaction {
  id: string;
  type: string;
  subject: string;
  body: string | null;
  followUpAt: string | null;
  createdAt: string;
}

export function InteractionPanel({
  customerId,
  interactions,
}: {
  customerId: string;
  interactions: Interaction[];
}) {
  const [state, formAction, pending] = useActionState<InteractionFormState, FormData>(
    addCustomerInteractionAction,
    undefined,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  const E = (f: string) => state?.fieldErrors?.[f]?.[0];

  return (
    <Card className="p-0">
      <div className="px-4 py-3 border-b text-sm font-medium">Interactions</div>
      <div className="p-4 space-y-4">
        <form ref={formRef} action={formAction} className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <input type="hidden" name="customerId" value={customerId} />
          <div className="md:col-span-2 space-y-1">
            <Label htmlFor="type">Type</Label>
            <select id="type" name="type" defaultValue="NOTE" className={selectClass}>
              {TYPES.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-4 space-y-1">
            <Label htmlFor="subject">
              Subject <span className="text-destructive">*</span>
            </Label>
            <Input id="subject" name="subject" required />
            {E('subject') && <p className="text-xs text-destructive">{E('subject')}</p>}
          </div>
          <div className="md:col-span-4 space-y-1">
            <Label htmlFor="body">Details</Label>
            <Textarea id="body" name="body" rows={2} />
          </div>
          <div className="md:col-span-2 space-y-1">
            <Label htmlFor="followUpAt">Follow-up</Label>
            <Input id="followUpAt" name="followUpAt" type="datetime-local" />
          </div>
          <div className="md:col-span-6 flex items-center justify-between">
            {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
            <div className="ml-auto">
              <Button type="submit" variant="dark" size="sm" disabled={pending}>
                {pending ? 'Saving…' : 'Log interaction'}
              </Button>
            </div>
          </div>
        </form>

        <div className="divide-y">
          {interactions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              No interactions yet. Log a call, email, or note above.
            </p>
          ) : (
            interactions.map((i) => (
              <div key={i.id} className="py-3 flex items-start gap-3">
                <Pill tone="grey">{i.type.toLowerCase().replace('_', ' ')}</Pill>
                <div className="flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm font-medium">{i.subject}</p>
                    <p className="text-xs text-muted-foreground tabular">
                      {new Date(i.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {i.body && (
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-1">
                      {i.body}
                    </p>
                  )}
                  {i.followUpAt && (
                    <p className="text-xs text-amber-600 mt-1">
                      Follow-up: {new Date(i.followUpAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Card>
  );
}

'use client';

import { useActionState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  approveAction,
  rejectAction,
  requestChangesAction,
  cancelApprovalAction,
  type ApprovalFormState,
} from '@/server/actions/approvals';

export function ApprovalDecisionPanel({
  requestId,
  canDecide,
  canCancel,
  activeRole,
}: {
  requestId: string;
  canDecide: boolean;
  canCancel: boolean;
  activeRole: string | null;
}) {
  const [approveState, approve, approvePending] = useActionState<ApprovalFormState, FormData>(
    approveAction,
    undefined,
  );
  const [rejectState, reject, rejectPending] = useActionState<ApprovalFormState, FormData>(
    rejectAction,
    undefined,
  );
  const [changesState, changes, changesPending] = useActionState<ApprovalFormState, FormData>(
    requestChangesAction,
    undefined,
  );
  const [cancelState, cancel, cancelPending] = useActionState<ApprovalFormState, FormData>(
    cancelApprovalAction,
    undefined,
  );

  if (!canDecide && !canCancel) {
    return (
      <Card className="p-4 text-sm text-muted-foreground">
        {activeRole
          ? `Waiting on role "${activeRole}". You don't have approver rights on the active step.`
          : 'No action available.'}
      </Card>
    );
  }

  return (
    <Card className="p-4 space-y-4">
      <div className="text-sm font-medium">Your decision</div>
      {canDecide && (
        <>
          <div>
            <Label className="text-xs">Note (optional)</Label>
            <Textarea id="decision-note" form="approve-form" name="note" rows={3} />
          </div>
          <form id="approve-form" action={approve} className="space-y-2">
            <input type="hidden" name="requestId" value={requestId} />
            <Button
              type="submit"
              variant="dark"
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              disabled={approvePending}
            >
              {approvePending ? 'Approving…' : 'Approve'}
            </Button>
          </form>
          <form action={changes} className="space-y-2">
            <input type="hidden" name="requestId" value={requestId} />
            <input
              type="hidden"
              name="note"
              value=""
              // shared textarea content is submitted via the approve-form id;
              // for changes/reject we reuse the same textarea element via the
              // browser — user types once, picks the button they want.
            />
            <Button
              type="submit"
              variant="outline"
              className="w-full"
              disabled={changesPending}
              onClick={(e) => {
                const ta = document.getElementById('decision-note') as HTMLTextAreaElement | null;
                if (ta) (e.currentTarget.form as HTMLFormElement).note.value = ta.value;
              }}
            >
              {changesPending ? 'Requesting…' : 'Request changes'}
            </Button>
          </form>
          <form action={reject} className="space-y-2">
            <input type="hidden" name="requestId" value={requestId} />
            <input type="hidden" name="note" value="" />
            <Button
              type="submit"
              variant="destructive"
              className="w-full"
              disabled={rejectPending}
              onClick={(e) => {
                const ta = document.getElementById('decision-note') as HTMLTextAreaElement | null;
                if (ta) (e.currentTarget.form as HTMLFormElement).note.value = ta.value;
              }}
            >
              {rejectPending ? 'Rejecting…' : 'Reject'}
            </Button>
          </form>
          {(approveState?.error || rejectState?.error || changesState?.error) && (
            <p className="text-xs text-red-600">
              {approveState?.error || rejectState?.error || changesState?.error}
            </p>
          )}
        </>
      )}

      {canCancel && (
        <form action={cancel} className="space-y-2 pt-2 border-t">
          <input type="hidden" name="requestId" value={requestId} />
          <Button type="submit" variant="ghost" className="w-full" disabled={cancelPending}>
            {cancelPending ? 'Cancelling…' : 'Cancel request'}
          </Button>
          {cancelState?.error && <p className="text-xs text-red-600">{cancelState.error}</p>}
        </form>
      )}
    </Card>
  );
}

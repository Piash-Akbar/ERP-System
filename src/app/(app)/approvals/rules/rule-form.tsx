'use client';

import { useActionState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  upsertApprovalRuleAction,
  type ApprovalFormState,
} from '@/server/actions/approvals';

export function RuleForm() {
  const [state, action, pending] = useActionState<ApprovalFormState, FormData>(
    upsertApprovalRuleAction,
    undefined,
  );
  return (
    <Card className="p-4 space-y-3">
      <h3 className="font-semibold text-sm">Add / update rule</h3>
      <form action={action} className="space-y-3">
        <div>
          <Label>Name *</Label>
          <Input name="name" required placeholder="e.g. PO > 100k" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Module</Label>
            <Input name="module" required placeholder="purchase" />
          </div>
          <div>
            <Label>Action</Label>
            <Input name="action" required placeholder="write" />
          </div>
        </div>
        <div>
          <Label>Minimum amount</Label>
          <Input type="number" min="0" step="0.01" name="minAmount" defaultValue={0} />
        </div>
        <div>
          <Label>Approver roles (comma-separated, in order)</Label>
          <Input name="approverRoles" required placeholder="Manager, Director" />
        </div>
        <div>
          <Label>Escalate after (hours)</Label>
          <Input type="number" min="1" name="escalateAfterHours" defaultValue={24} />
        </div>
        <div className="flex items-center gap-2">
          <input id="isActive" type="checkbox" name="isActive" defaultChecked />
          <Label htmlFor="isActive" className="mb-0">
            Active
          </Label>
        </div>
        <div>
          <Label>Description</Label>
          <Textarea name="description" rows={2} />
        </div>
        <Button type="submit" variant="dark" className="w-full" disabled={pending}>
          {pending ? 'Saving…' : 'Save rule'}
        </Button>
        {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
        {state?.success && <p className="text-xs text-emerald-600">Saved.</p>}
      </form>
    </Card>
  );
}

'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { createUserAction, updateUserAction, type UserFormState } from '@/server/actions/users';

export interface UserFormProps {
  mode: 'create' | 'edit';
  initial?: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    status: 'ACTIVE' | 'DISABLED' | 'PENDING';
    defaultBranchId: string | null;
    roleIds: string[];
  };
  roles: { id: string; name: string; description: string | null }[];
  branches: { id: string; name: string; code: string }[];
}

export function UserForm({ mode, initial, roles, branches }: UserFormProps) {
  const action = mode === 'create' ? createUserAction : updateUserAction;
  const [state, formAction, pending] = useActionState<UserFormState, FormData>(action, undefined);

  return (
    <form action={formAction} className="space-y-6">
      {mode === 'edit' && <input type="hidden" name="id" value={initial?.id} />}

      <Card>
        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Full name" name="name" required defaultValue={initial?.name} errors={state?.fieldErrors?.name} />
          <Field
            label="Email"
            name="email"
            type="email"
            required
            defaultValue={initial?.email}
            errors={state?.fieldErrors?.email}
          />
          <Field label="Phone" name="phone" defaultValue={initial?.phone ?? ''} errors={state?.fieldErrors?.phone} />
          <Field
            label={mode === 'create' ? 'Password' : 'New password (leave blank to keep current)'}
            name="password"
            type="password"
            required={mode === 'create'}
            errors={state?.fieldErrors?.password}
          />
          <div className="space-y-2">
            <Label htmlFor="defaultBranchId">Default branch</Label>
            <select
              id="defaultBranchId"
              name="defaultBranchId"
              defaultValue={initial?.defaultBranchId ?? ''}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            >
              <option value="">— none —</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              name="status"
              defaultValue={initial?.status ?? 'ACTIVE'}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            >
              <option value="ACTIVE">Active</option>
              <option value="DISABLED">Disabled</option>
              <option value="PENDING">Pending</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <Label>Roles</Label>
          <p className="text-xs text-muted-foreground mb-3">Assign one or more roles to control access.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {roles.map((r) => (
              <label
                key={r.id}
                className="flex items-start gap-3 rounded-md border p-3 text-sm hover:bg-muted/30 cursor-pointer"
              >
                <input
                  type="checkbox"
                  name="roleIds"
                  value={r.id}
                  defaultChecked={initial?.roleIds.includes(r.id)}
                  className="mt-0.5 h-4 w-4 accent-primary"
                />
                <div>
                  <p className="font-medium">{r.name}</p>
                  {r.description && <p className="text-xs text-muted-foreground">{r.description}</p>}
                </div>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving…' : mode === 'create' ? 'Create user' : 'Save changes'}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/users">Cancel</Link>
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  type = 'text',
  required,
  defaultValue,
  errors,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
  errors?: string[];
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <Input id={name} name={name} type={type} required={required} defaultValue={defaultValue} />
      {errors?.length && <p className="text-xs text-destructive">{errors[0]}</p>}
    </div>
  );
}

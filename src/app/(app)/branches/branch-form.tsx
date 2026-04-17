'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { createBranchAction, updateBranchAction, type BranchFormState } from '@/server/actions/branches';

export interface BranchFormProps {
  mode: 'create' | 'edit';
  initial?: {
    id: string;
    code: string;
    name: string;
    type: string;
    currency: 'BDT' | 'INR' | 'USD' | 'EUR';
    address: string | null;
    phone: string | null;
    email: string | null;
    allowNegativeStock: boolean;
    isActive: boolean;
  };
}

export function BranchForm({ mode, initial }: BranchFormProps) {
  const action = mode === 'create' ? createBranchAction : updateBranchAction;
  const [state, formAction, pending] = useActionState<BranchFormState, FormData>(action, undefined);

  return (
    <form action={formAction} className="space-y-6">
      {mode === 'edit' && <input type="hidden" name="id" value={initial?.id} />}

      <Card>
        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field
            label="Code"
            name="code"
            required
            defaultValue={initial?.code}
            errors={state?.fieldErrors?.code}
            help="Short identifier (A–Z, 0–9, _, -)"
          />
          <Field label="Name" name="name" required defaultValue={initial?.name} errors={state?.fieldErrors?.name} />
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <select
              id="type"
              name="type"
              defaultValue={initial?.type ?? 'MAIN'}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            >
              <option value="MAIN">Main</option>
              <option value="FACTORY">Factory</option>
              <option value="SHOWROOM">Showroom</option>
              <option value="WAREHOUSE">Warehouse</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <select
              id="currency"
              name="currency"
              defaultValue={initial?.currency ?? 'BDT'}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            >
              <option value="BDT">৳ BDT</option>
              <option value="INR">₹ INR</option>
              <option value="USD">$ USD</option>
              <option value="EUR">€ EUR</option>
            </select>
          </div>
          <Field label="Phone" name="phone" defaultValue={initial?.phone ?? ''} />
          <Field label="Email" name="email" type="email" defaultValue={initial?.email ?? ''} errors={state?.fieldErrors?.email} />
          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea id="address" name="address" rows={2} defaultValue={initial?.address ?? ''} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-3">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              name="allowNegativeStock"
              defaultChecked={initial?.allowNegativeStock ?? false}
              className="h-4 w-4 accent-primary"
            />
            <span className="text-sm">
              Allow negative stock <span className="text-muted-foreground">(operator warnings only, not blocked)</span>
            </span>
          </label>
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
          {pending ? 'Saving…' : mode === 'create' ? 'Create branch' : 'Save changes'}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/branches">Cancel</Link>
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
  help,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
  errors?: string[];
  help?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <Input id={name} name={name} type={type} required={required} defaultValue={defaultValue} />
      {help && !errors?.length && <p className="text-xs text-muted-foreground">{help}</p>}
      {errors?.length && <p className="text-xs text-destructive">{errors[0]}</p>}
    </div>
  );
}

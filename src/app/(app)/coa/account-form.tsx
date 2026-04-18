'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import {
  createChartAccountAction,
  updateChartAccountAction,
  type CoaFormState,
} from '@/server/actions/coa';
import { ACCOUNT_TYPES, NORMAL_SIDES } from '@/server/validators/coa';

export interface AccountFormProps {
  mode: 'create' | 'edit';
  parents: { id: string; code: string; name: string; type: string; path: string }[];
  branches: { id: string; name: string; code: string }[];
  initial?: {
    id: string;
    code: string;
    name: string;
    type: (typeof ACCOUNT_TYPES)[number];
    normalSide: (typeof NORMAL_SIDES)[number];
    parentId: string | null;
    isPosting: boolean;
    isControl: boolean;
    currency: 'BDT' | 'INR' | 'USD' | 'EUR';
    branchId: string | null;
    openingBalance: string;
    description: string | null;
    isActive: boolean;
  };
}

export function AccountForm({ mode, parents, branches, initial }: AccountFormProps) {
  const action = mode === 'create' ? createChartAccountAction : updateChartAccountAction;
  const [state, formAction, pending] = useActionState<CoaFormState, FormData>(action, undefined);

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
            help="Unique account code, e.g. 1000, 1100, 1110.01"
          />
          <Field label="Name" name="name" required defaultValue={initial?.name} errors={state?.fieldErrors?.name} />

          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <select
              id="type"
              name="type"
              defaultValue={initial?.type ?? 'ASSET'}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            >
              {ACCOUNT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="normalSide">Normal side</Label>
            <select
              id="normalSide"
              name="normalSide"
              defaultValue={initial?.normalSide ?? 'DEBIT'}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            >
              {NORMAL_SIDES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="parentId">Parent account</Label>
            <select
              id="parentId"
              name="parentId"
              defaultValue={initial?.parentId ?? ''}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            >
              <option value="">— Root —</option>
              {parents.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.path} · {p.name}
                </option>
              ))}
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

          <div className="space-y-2">
            <Label htmlFor="branchId">Branch (optional)</Label>
            <select
              id="branchId"
              name="branchId"
              defaultValue={initial?.branchId ?? ''}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            >
              <option value="">— All branches —</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.code} · {b.name}
                </option>
              ))}
            </select>
          </div>

          <Field
            label="Opening balance"
            name="openingBalance"
            type="number"
            defaultValue={initial?.openingBalance ?? '0'}
            errors={state?.fieldErrors?.openingBalance}
          />

          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" rows={2} defaultValue={initial?.description ?? ''} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-3">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              name="isPosting"
              defaultChecked={initial?.isPosting ?? true}
              className="h-4 w-4 accent-primary"
            />
            <span className="text-sm">
              Posting account <span className="text-muted-foreground">(journal lines can post here — uncheck for headers)</span>
            </span>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              name="isControl"
              defaultChecked={initial?.isControl ?? false}
              className="h-4 w-4 accent-primary"
            />
            <span className="text-sm">
              Control account <span className="text-muted-foreground">(balance is derived from subledger)</span>
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
          {pending ? 'Saving…' : mode === 'create' ? 'Create account' : 'Save changes'}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/coa">Cancel</Link>
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
      {errors?.length ? <p className="text-xs text-destructive">{errors[0]}</p> : null}
    </div>
  );
}

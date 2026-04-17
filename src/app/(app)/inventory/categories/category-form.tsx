'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import {
  createCategoryAction,
  updateCategoryAction,
  type CategoryFormState,
} from '@/server/actions/product-categories';

export interface CategoryFormProps {
  mode: 'create' | 'edit';
  initial?: { id: string; name: string; description: string | null; parentId: string | null };
  parents: { id: string; name: string }[];
}

export function CategoryForm({ mode, initial, parents }: CategoryFormProps) {
  const action = mode === 'create' ? createCategoryAction : updateCategoryAction;
  const [state, formAction, pending] = useActionState<CategoryFormState, FormData>(action, undefined);
  const E = (f: string) => state?.fieldErrors?.[f]?.[0];

  return (
    <form action={formAction} className="space-y-6">
      {mode === 'edit' && <input type="hidden" name="id" value={initial?.id} />}
      <Card>
        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input id="name" name="name" required defaultValue={initial?.name} />
            {E('name') && <p className="text-xs text-destructive">{E('name')}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="parentId">Parent category</Label>
            <select
              id="parentId"
              name="parentId"
              defaultValue={initial?.parentId ?? ''}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            >
              <option value="">— top level —</option>
              {parents
                .filter((p) => p.id !== initial?.id)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" rows={2} defaultValue={initial?.description ?? ''} />
          </div>
        </CardContent>
      </Card>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <div className="flex items-center gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving…' : mode === 'create' ? 'Create category' : 'Save changes'}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/inventory/categories">Cancel</Link>
        </Button>
      </div>
    </form>
  );
}

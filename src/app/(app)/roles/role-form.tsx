'use client';

import Link from 'next/link';
import { useActionState, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { createRoleAction, updateRoleAction, type RoleFormState } from '@/server/actions/roles';

export interface RoleFormProps {
  mode: 'create' | 'edit';
  initial?: {
    id: string;
    name: string;
    description: string | null;
    permissionKeys: string[];
    isSystem: boolean;
  };
  permissions: { key: string; module: string; action: string }[];
}

export function RoleForm({ mode, initial, permissions }: RoleFormProps) {
  const action = mode === 'create' ? createRoleAction : updateRoleAction;
  const [state, formAction, pending] = useActionState<RoleFormState, FormData>(action, undefined);
  const [selected, setSelected] = useState<Set<string>>(() => new Set(initial?.permissionKeys ?? []));

  const grouped = useMemo(() => {
    const map = new Map<string, { key: string; action: string }[]>();
    for (const p of permissions) {
      const arr = map.get(p.module) ?? [];
      arr.push({ key: p.key, action: p.action });
      map.set(p.module, arr);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [permissions]);

  const toggle = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleModule = (moduleKeys: string[]) => {
    setSelected((prev) => {
      const next = new Set(prev);
      const allOn = moduleKeys.every((k) => next.has(k));
      for (const k of moduleKeys) {
        if (allOn) next.delete(k);
        else next.add(k);
      }
      return next;
    });
  };

  return (
    <form action={formAction} className="space-y-6">
      {mode === 'edit' && <input type="hidden" name="id" value={initial?.id} />}
      {[...selected].map((k) => (
        <input key={k} type="hidden" name="permissionKeys" value={k} />
      ))}

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                required
                defaultValue={initial?.name}
                disabled={initial?.isSystem}
              />
              {state?.fieldErrors?.name?.[0] && (
                <p className="text-xs text-destructive">{state.fieldErrors.name[0]}</p>
              )}
              {initial?.isSystem && (
                <p className="text-xs text-muted-foreground">System role — name cannot be changed.</p>
              )}
            </div>
            <div className="space-y-2 md:col-span-1">
              <Label>Selected permissions</Label>
              <p className="h-9 flex items-center text-sm text-muted-foreground tabular">
                {selected.size} of {permissions.length}
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" rows={2} defaultValue={initial?.description ?? ''} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <Label>Permissions</Label>
              <p className="text-xs text-muted-foreground">
                Toggle per action, or click a module header to toggle all of its actions at once.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {grouped.map(([module, rows]) => {
              const keys = rows.map((r) => r.key);
              const allOn = keys.every((k) => selected.has(k));
              const anyOn = keys.some((k) => selected.has(k));
              return (
                <div key={module} className="rounded-md border">
                  <button
                    type="button"
                    onClick={() => toggleModule(keys)}
                    className="w-full flex items-center justify-between px-3 py-2 border-b bg-muted/40 text-left"
                  >
                    <span className="font-medium capitalize text-sm">{module}</span>
                    <span
                      className={
                        'text-[10px] uppercase tracking-wider ' +
                        (allOn ? 'text-success' : anyOn ? 'text-warning' : 'text-muted-foreground')
                      }
                    >
                      {allOn ? 'all' : anyOn ? 'partial' : 'none'}
                    </span>
                  </button>
                  <ul className="p-2 space-y-1">
                    {rows.map((r) => (
                      <li key={r.key}>
                        <label className="flex items-center gap-2 px-2 py-1 rounded text-sm hover:bg-muted/40 cursor-pointer">
                          <input
                            type="checkbox"
                            className="h-4 w-4 accent-primary"
                            checked={selected.has(r.key)}
                            onChange={() => toggle(r.key)}
                          />
                          <span className="text-muted-foreground">{r.action}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving…' : mode === 'create' ? 'Create role' : 'Save changes'}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/roles">Cancel</Link>
        </Button>
      </div>
    </form>
  );
}

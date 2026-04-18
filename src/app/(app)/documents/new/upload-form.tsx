'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  uploadDocumentAction,
  type DocumentFormState,
} from '@/server/actions/documents';

type Branch = { id: string; name: string; code: string };

export function UploadForm({ branches }: { branches: Branch[] }) {
  const router = useRouter();
  const [state, action, pending] = useActionState<DocumentFormState, FormData>(
    uploadDocumentAction,
    undefined,
  );

  useEffect(() => {
    if (state?.success && state.documentId) {
      router.push(`/documents/${state.documentId}`);
    }
  }, [state, router]);

  return (
    <Card className="p-6">
      <form action={action} className="space-y-4" encType="multipart/form-data">
        <div>
          <Label>File *</Label>
          <Input type="file" name="file" required />
          <p className="text-xs text-muted-foreground mt-1">Max 20MB. Images, PDFs, docs, text.</p>
        </div>
        <div>
          <Label>Branch (optional)</Label>
          <select
            name="branchId"
            className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          >
            <option value="">— none —</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.code})
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label>Category</Label>
          <Input name="category" placeholder="invoice, contract, license…" />
        </div>
        <div>
          <Label>Tags (comma-separated)</Label>
          <Input name="tags" placeholder="2026, fire-safety" />
        </div>
        <div>
          <Label>Expires at</Label>
          <Input type="date" name="expiresAt" />
        </div>
        <div>
          <Label>Notes</Label>
          <Textarea name="notes" rows={2} />
        </div>
        {state?.error && (
          <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">
            {state.error}
          </div>
        )}
        <Button type="submit" variant="dark" disabled={pending}>
          {pending ? 'Uploading…' : 'Upload'}
        </Button>
      </form>
    </Card>
  );
}

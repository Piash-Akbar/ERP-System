import Link from 'next/link';
import { FileText, Upload } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/shared/data-table';
import { Pill } from '@/components/shared/pill';
import { documentService } from '@/server/services/document.service';
import { getSession } from '@/server/auth/session';

export const metadata = { title: 'Documents' };

interface Search {
  category?: string;
  search?: string;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const session = await getSession();
  const sp = await searchParams;
  const [docs, expiring] = await Promise.all([
    documentService.list(session, {
      category: sp.category || undefined,
      search: sp.search || undefined,
    }),
    documentService.expiringSoon(session, 30),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documents"
        description="Central document repository — linked to any entity via tags"
      >
        <Button variant="dark" asChild>
          <Link href="/documents/new">
            <Upload className="h-4 w-4" /> Upload
          </Link>
        </Button>
      </PageHeader>

      {expiring.length > 0 && (
        <Card className="p-4 border-amber-300 bg-amber-50">
          <div className="text-sm font-medium text-amber-900 mb-2">
            {expiring.length} document{expiring.length === 1 ? '' : 's'} expiring within 30 days
          </div>
          <ul className="text-xs text-amber-900/80 space-y-0.5">
            {expiring.slice(0, 5).map((d) => (
              <li key={d.id} className="tabular">
                <Link href={`/documents/${d.id}`} className="hover:underline">
                  {d.originalName} — {d.expiresAt?.toISOString().slice(0, 10)}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="p-4">
        <form className="grid grid-cols-1 md:grid-cols-[1fr_220px_auto] gap-3 items-end">
          <Input
            name="search"
            placeholder="Search by filename or tag…"
            defaultValue={sp.search ?? ''}
          />
          <Input
            name="category"
            placeholder="Category"
            defaultValue={sp.category ?? ''}
          />
          <Button type="submit" variant="outline">
            Filter
          </Button>
        </form>
      </Card>

      <Card className="p-0">
        <div className="px-4 py-3 border-b text-sm font-medium">
          {docs.length} document{docs.length === 1 ? '' : 's'}
        </div>
        <DataTable
          rows={docs}
          rowKey={(r) => r.id}
          empty="No documents yet. Upload your first one."
          columns={[
            {
              key: 'name',
              header: 'Name',
              cell: (r) => (
                <Link href={`/documents/${r.id}`} className="text-blue-600 hover:underline flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  {r.originalName}
                </Link>
              ),
            },
            { key: 'category', header: 'Category', cell: (r) => r.category ?? '—' },
            {
              key: 'tags',
              header: 'Tags',
              cell: (r) => (
                <div className="flex gap-1 flex-wrap">
                  {r.tags.map((t) => (
                    <Pill key={t} tone="neutral">
                      {t}
                    </Pill>
                  ))}
                </div>
              ),
            },
            {
              key: 'size',
              header: 'Size',
              align: 'right',
              cell: (r) => <span className="tabular text-xs">{formatSize(r.size)}</span>,
            },
            {
              key: 'links',
              header: 'Links',
              align: 'right',
              cell: (r) => <span className="tabular">{r._count.links}</span>,
            },
            {
              key: 'expires',
              header: 'Expires',
              cell: (r) => (
                <span className="tabular text-xs">
                  {r.expiresAt?.toISOString().slice(0, 10) ?? '—'}
                </span>
              ),
            },
            {
              key: 'uploaded',
              header: 'Uploaded',
              cell: (r) => (
                <span className="tabular text-xs">{r.createdAt.toISOString().slice(0, 10)}</span>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}

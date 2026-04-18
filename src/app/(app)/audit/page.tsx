import Link from 'next/link';
import { PageHeader } from '@/components/shared/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/shared/data-table';
import { Pill } from '@/components/shared/pill';
import { auditService } from '@/server/services/audit.service';
import { getSession } from '@/server/auth/session';

export const metadata = { title: 'Audit log' };

interface Search {
  module?: string;
  search?: string;
  from?: string;
  to?: string;
  page?: string;
}

const PAGE_SIZE = 50;

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const session = await getSession();
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? '1'));
  const [{ rows, total }, modules] = await Promise.all([
    auditService.list(session, {
      module: sp.module && sp.module !== 'ALL' ? sp.module : undefined,
      search: sp.search,
      from: sp.from ? new Date(sp.from) : undefined,
      to: sp.to ? new Date(sp.to + 'T23:59:59') : undefined,
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
    }),
    auditService.modules(session),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Log"
        description={`${total.toLocaleString()} immutable record${total === 1 ? '' : 's'} across all modules`}
      />

      <Card className="p-4">
        <form className="grid grid-cols-1 md:grid-cols-[1fr_180px_160px_160px_auto] gap-3 items-end">
          <Input
            name="search"
            placeholder="Search by entity, action…"
            defaultValue={sp.search ?? ''}
          />
          <select
            name="module"
            defaultValue={sp.module ?? 'ALL'}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
          >
            <option value="ALL">All modules</option>
            {modules.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <Input type="date" name="from" defaultValue={sp.from ?? ''} />
          <Input type="date" name="to" defaultValue={sp.to ?? ''} />
          <Button type="submit" variant="outline">
            Filter
          </Button>
        </form>
      </Card>

      <Card className="p-0">
        <div className="px-4 py-3 border-b text-sm font-medium flex items-center justify-between">
          <span>
            {rows.length} of {total} entries — page {page} / {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Button variant="ghost" size="sm" asChild>
                <Link href={`?${new URLSearchParams({ ...sp, page: String(page - 1) }).toString()}`}>
                  Previous
                </Link>
              </Button>
            )}
            {page < totalPages && (
              <Button variant="ghost" size="sm" asChild>
                <Link href={`?${new URLSearchParams({ ...sp, page: String(page + 1) }).toString()}`}>
                  Next
                </Link>
              </Button>
            )}
          </div>
        </div>
        <DataTable
          rows={rows}
          rowKey={(r) => r.id}
          empty="No audit entries match the filters."
          columns={[
            {
              key: 'when',
              header: 'When',
              cell: (r) => (
                <span className="tabular text-xs">
                  {r.createdAt.toISOString().replace('T', ' ').slice(0, 19)}
                </span>
              ),
            },
            {
              key: 'who',
              header: 'Actor',
              cell: (r) => r.actor?.name ?? r.actor?.email ?? <span className="text-muted-foreground">—</span>,
            },
            { key: 'module', header: 'Module', cell: (r) => <Pill tone="blue">{r.module}</Pill> },
            { key: 'action', header: 'Action', cell: (r) => r.action },
            {
              key: 'entity',
              header: 'Entity',
              cell: (r) => (
                <span className="tabular text-xs">
                  {r.entityType}
                  {r.entityId && <span className="text-muted-foreground"> #{r.entityId.slice(0, 8)}</span>}
                </span>
              ),
            },
            { key: 'branch', header: 'Branch', cell: (r) => r.branch?.name ?? '—' },
            {
              key: 'view',
              header: '',
              cell: (r) => (
                <Link href={`/audit/${r.id}`} className="text-blue-600 text-xs hover:underline">
                  View
                </Link>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}

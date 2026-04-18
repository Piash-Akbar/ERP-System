import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pill } from '@/components/shared/pill';
import { auditService } from '@/server/services/audit.service';
import { getSession } from '@/server/auth/session';

export const metadata = { title: 'Audit entry' };

export default async function AuditDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  const entry = await auditService.getById(session, id);
  if (!entry) notFound();

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader title="Audit entry" description={entry.id}>
        <Button variant="outline" asChild>
          <Link href="/audit">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        </Button>
      </PageHeader>

      <Card className="p-6 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
        <div>
          <div className="text-muted-foreground text-xs">When</div>
          <div className="tabular">{entry.createdAt.toISOString().replace('T', ' ').slice(0, 19)}</div>
        </div>
        <div>
          <div className="text-muted-foreground text-xs">Module</div>
          <Pill tone="blue">{entry.module}</Pill>
        </div>
        <div>
          <div className="text-muted-foreground text-xs">Action</div>
          <div>{entry.action}</div>
        </div>
        <div>
          <div className="text-muted-foreground text-xs">Actor</div>
          <div>{entry.actor?.name ?? entry.actor?.email ?? '—'}</div>
        </div>
        <div>
          <div className="text-muted-foreground text-xs">Branch</div>
          <div>{entry.branch?.name ?? '—'}</div>
        </div>
        <div>
          <div className="text-muted-foreground text-xs">Entity</div>
          <div className="tabular text-xs">
            {entry.entityType}
            {entry.entityId && ` #${entry.entityId}`}
          </div>
        </div>
        <div>
          <div className="text-muted-foreground text-xs">IP</div>
          <div className="tabular text-xs">{entry.ip ?? '—'}</div>
        </div>
        <div className="md:col-span-2">
          <div className="text-muted-foreground text-xs">User agent</div>
          <div className="text-xs break-all">{entry.userAgent ?? '—'}</div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-4">
          <div className="text-xs font-semibold mb-2 text-muted-foreground">BEFORE</div>
          <pre className="text-xs bg-muted/40 rounded p-3 overflow-x-auto">
            {entry.before ? JSON.stringify(entry.before, null, 2) : '—'}
          </pre>
        </Card>
        <Card className="p-4">
          <div className="text-xs font-semibold mb-2 text-muted-foreground">AFTER</div>
          <pre className="text-xs bg-muted/40 rounded p-3 overflow-x-auto">
            {entry.after ? JSON.stringify(entry.after, null, 2) : '—'}
          </pre>
        </Card>
      </div>
    </div>
  );
}

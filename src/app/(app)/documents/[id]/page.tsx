import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Download } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/shared/data-table';
import { Pill } from '@/components/shared/pill';
import { documentService } from '@/server/services/document.service';
import { getSession } from '@/server/auth/session';
import { NotFoundError } from '@/lib/errors';
import { LinkForm, UnlinkButton } from './link-controls';

export const metadata = { title: 'Document' };

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  let doc: Awaited<ReturnType<typeof documentService.getById>>;
  try {
    doc = await documentService.getById(session, id);
  } catch (e) {
    if (e instanceof NotFoundError) notFound();
    throw e;
  }

  return (
    <div className="space-y-6">
      <PageHeader title={doc.originalName} description={doc.mimeType}>
        <Button variant="outline" asChild>
          <Link href="/documents">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        </Button>
        <Button variant="dark" asChild>
          <a href={`/api/documents/${doc.id}`} target="_blank" rel="noreferrer">
            <Download className="h-4 w-4" /> Download
          </a>
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        <div className="space-y-6">
          <Card className="p-6 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground text-xs">Size</div>
              <div className="tabular">{(doc.size / 1024).toFixed(1)} KB</div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs">Category</div>
              <div>{doc.category ?? '—'}</div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs">Expires</div>
              <div className="tabular">{doc.expiresAt?.toISOString().slice(0, 10) ?? '—'}</div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs">Uploaded</div>
              <div className="tabular">{doc.createdAt.toISOString().slice(0, 10)}</div>
            </div>
            <div className="md:col-span-2">
              <div className="text-muted-foreground text-xs">Tags</div>
              <div className="flex flex-wrap gap-1 mt-0.5">
                {doc.tags.length === 0 ? (
                  '—'
                ) : (
                  doc.tags.map((t) => (
                    <Pill key={t} tone="neutral">
                      {t}
                    </Pill>
                  ))
                )}
              </div>
            </div>
            {doc.notes && (
              <div className="md:col-span-3 pt-3 border-t text-muted-foreground">{doc.notes}</div>
            )}
          </Card>

          {doc.mimeType.startsWith('image/') && (
            <Card className="p-4">
              <img
                src={`/api/documents/${doc.id}`}
                alt={doc.originalName}
                className="max-h-96 mx-auto rounded"
              />
            </Card>
          )}

          <Card className="p-0">
            <div className="px-4 py-3 border-b text-sm font-medium">
              Linked entities ({doc.links.length})
            </div>
            <DataTable
              rows={doc.links}
              rowKey={(r) => r.id}
              empty="Not linked to anything yet."
              columns={[
                { key: 'type', header: 'Entity type', cell: (r) => r.entityType },
                {
                  key: 'id',
                  header: 'Entity ID',
                  cell: (r) => <span className="tabular text-xs">{r.entityId}</span>,
                },
                { key: 'note', header: 'Note', cell: (r) => r.note ?? '—' },
                {
                  key: 'when',
                  header: 'Linked',
                  cell: (r) => (
                    <span className="tabular text-xs">
                      {r.createdAt.toISOString().slice(0, 10)}
                    </span>
                  ),
                },
                {
                  key: 'action',
                  header: '',
                  cell: (r) => <UnlinkButton documentId={doc.id} linkId={r.id} />,
                },
              ]}
            />
          </Card>
        </div>

        <LinkForm documentId={doc.id} />
      </div>
    </div>
  );
}

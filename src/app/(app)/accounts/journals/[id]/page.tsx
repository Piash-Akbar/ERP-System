import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSession } from '@/server/auth/session';
import { accountsService } from '@/server/services/accounts.service';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NotFoundError } from '@/lib/errors';
import { postDraftAction, voidEntryAction } from '@/server/actions/accounts';

export const metadata = { title: 'Journal entry' };

const STATUS_VARIANT: Record<string, 'default' | 'outline' | 'success' | 'warning' | 'destructive'> = {
  DRAFT: 'warning',
  POSTED: 'success',
  VOIDED: 'destructive',
};

export default async function JournalEntryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();

  let entry;
  try {
    entry = await accountsService.getEntry(session, id);
  } catch (e) {
    if (e instanceof NotFoundError) notFound();
    throw e;
  }

  const canPost = session?.permissions.includes('accounts:post') ?? false;
  const canVoid = session?.permissions.includes('accounts:void') ?? false;

  return (
    <div className="space-y-6">
      <PageHeader title={entry.number} description={`${entry.date.toISOString().slice(0, 10)} · ${entry.branch.name} · ${entry.period.name}`}>
        <Badge variant={STATUS_VARIANT[entry.status] ?? 'outline'}>{entry.status}</Badge>
      </PageHeader>

      {entry.reverses && (
        <Card>
          <CardContent className="p-4 text-sm">
            This entry reverses{' '}
            <Link href={`/accounts/journals/${entry.reverses.id}`} className="text-primary underline">
              {entry.reverses.number}
            </Link>
            .
          </CardContent>
        </Card>
      )}
      {entry.reversedBy && (
        <Card>
          <CardContent className="p-4 text-sm">
            Voided by reversal{' '}
            <Link href={`/accounts/journals/${entry.reversedBy.id}`} className="text-primary underline">
              {entry.reversedBy.number}
            </Link>
            .
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <Info label="Reference" value={entry.reference ?? '—'} />
          <Info label="Created" value={entry.createdAt.toISOString().slice(0, 16).replace('T', ' ')} />
          <Info label="Posted at" value={entry.postedAt ? entry.postedAt.toISOString().slice(0, 16).replace('T', ' ') : '—'} />
          <div className="md:col-span-3">
            <Info label="Memo" value={entry.memo ?? '—'} />
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left font-semibold px-4 py-3 w-10">#</th>
                <th className="text-left font-semibold px-4 py-3">Account</th>
                <th className="text-right font-semibold px-4 py-3 tabular-nums">Debit</th>
                <th className="text-right font-semibold px-4 py-3 tabular-nums">Credit</th>
                <th className="text-left font-semibold px-4 py-3">Memo</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {entry.lines.map((l) => (
                <tr key={l.id}>
                  <td className="px-4 py-2 text-muted-foreground">{l.lineNo}</td>
                  <td className="px-4 py-2 font-mono text-xs">
                    {l.account.code} <span className="text-muted-foreground">· {l.account.name}</span>
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {l.debit.greaterThan(0) ? l.debit.toString() : ''}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {l.credit.greaterThan(0) ? l.credit.toString() : ''}
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">{l.memo ?? '—'}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-muted/40 font-semibold">
              <tr>
                <td colSpan={2} className="px-4 py-2 text-right text-xs uppercase">Total</td>
                <td className="px-4 py-2 text-right tabular-nums">{entry.totalDebit.toString()}</td>
                <td className="px-4 py-2 text-right tabular-nums">{entry.totalCredit.toString()}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      <div className="flex items-center gap-2">
        {entry.status === 'DRAFT' && canPost && (
          <form action={postDraftAction}>
            <input type="hidden" name="id" value={entry.id} />
            <Button type="submit">Post entry</Button>
          </form>
        )}
        {entry.status === 'POSTED' && canVoid && !entry.reversesId && !entry.reversedBy && (
          <form action={voidEntryAction} className="flex items-center gap-2">
            <input type="hidden" name="id" value={entry.id} />
            <input
              type="text"
              name="reason"
              required
              minLength={3}
              placeholder="Reason for void"
              className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm w-64"
            />
            <Button type="submit" variant="destructive">
              Void (reverse)
            </Button>
          </form>
        )}
        <Button type="button" variant="ghost" asChild>
          <Link href="/accounts/journals">Back</Link>
        </Button>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1">{value}</div>
    </div>
  );
}

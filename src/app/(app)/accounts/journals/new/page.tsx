import { getSession } from '@/server/auth/session';
import { authorize } from '@/server/auth/authorize';
import { coaService } from '@/server/services/coa.service';
import { branchService } from '@/server/services/branch.service';
import { PageHeader } from '@/components/shared/page-header';
import { JournalEditor } from '../_components/journal-editor';

export const metadata = { title: 'New journal entry' };

export default async function NewJournalPage() {
  const session = await getSession();
  await authorize(session, 'accounts:post');
  const [accounts, branches] = await Promise.all([
    coaService.list(session, { activeOnly: true }),
    branchService.listActive(session),
  ]);

  const postingAccounts = accounts
    .filter((a) => a.isPosting && a.isActive)
    .map((a) => ({ id: a.id, code: a.code, name: a.name, type: a.type }));

  return (
    <div>
      <PageHeader title="New journal entry" description="Manual debit/credit entry. Totals must balance before posting." />
      <JournalEditor
        branches={branches.map((b) => ({ id: b.id, code: b.code, name: b.name, currency: b.currency }))}
        accounts={postingAccounts}
        defaultBranchId={session?.activeBranchId ?? branches[0]?.id ?? ''}
      />
    </div>
  );
}

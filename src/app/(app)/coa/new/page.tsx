import { getSession } from '@/server/auth/session';
import { coaService } from '@/server/services/coa.service';
import { branchService } from '@/server/services/branch.service';
import { authorize } from '@/server/auth/authorize';
import { PageHeader } from '@/components/shared/page-header';
import { AccountForm } from '../account-form';

export const metadata = { title: 'New account' };

export default async function NewAccountPage() {
  const session = await getSession();
  await authorize(session, 'coa:write');
  const [accounts, branches] = await Promise.all([
    coaService.list(session),
    branchService.listActive(session),
  ]);
  return (
    <div>
      <PageHeader title="New account" description="Add a ledger account to the chart." />
      <AccountForm
        mode="create"
        parents={accounts.map((a) => ({ id: a.id, code: a.code, name: a.name, type: a.type, path: a.path }))}
        branches={branches.map((b) => ({ id: b.id, code: b.code, name: b.name }))}
      />
    </div>
  );
}

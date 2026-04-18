import { notFound } from 'next/navigation';
import { getSession } from '@/server/auth/session';
import { coaService } from '@/server/services/coa.service';
import { branchService } from '@/server/services/branch.service';
import { authorize } from '@/server/auth/authorize';
import { PageHeader } from '@/components/shared/page-header';
import { NotFoundError } from '@/lib/errors';
import { AccountForm } from '../account-form';

export const metadata = { title: 'Edit account' };

export default async function EditAccountPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  await authorize(session, 'coa:write');

  let account;
  try {
    account = await coaService.getById(session, id);
  } catch (e) {
    if (e instanceof NotFoundError) notFound();
    throw e;
  }

  const [accounts, branches] = await Promise.all([
    coaService.list(session),
    branchService.listActive(session),
  ]);

  return (
    <div>
      <PageHeader title={`Edit ${account.code}`} description={account.name} />
      <AccountForm
        mode="edit"
        parents={accounts
          .filter((a) => a.id !== account.id && !a.path.startsWith(`${account.path}/`))
          .map((a) => ({ id: a.id, code: a.code, name: a.name, type: a.type, path: a.path }))}
        branches={branches.map((b) => ({ id: b.id, code: b.code, name: b.name }))}
        initial={{
          id: account.id,
          code: account.code,
          name: account.name,
          type: account.type,
          normalSide: account.normalSide,
          parentId: account.parentId,
          isPosting: account.isPosting,
          isControl: account.isControl,
          currency: account.currency,
          branchId: account.branchId,
          openingBalance: account.openingBalance.toString(),
          description: account.description,
          isActive: account.isActive,
        }}
      />
    </div>
  );
}

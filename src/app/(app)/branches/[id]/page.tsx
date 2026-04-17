import { getSession } from '@/server/auth/session';
import { branchService } from '@/server/services/branch.service';
import { PageHeader } from '@/components/shared/page-header';
import { BranchForm } from '../branch-form';

export const metadata = { title: 'Edit branch' };

export default async function EditBranchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  const branch = await branchService.getById(session, id);

  return (
    <div>
      <PageHeader title={branch.name} description={`${branch.code} · ${branch.currency}`} />
      <BranchForm
        mode="edit"
        initial={{
          id: branch.id,
          code: branch.code,
          name: branch.name,
          type: branch.type,
          currency: branch.currency,
          address: branch.address,
          phone: branch.phone,
          email: branch.email,
          allowNegativeStock: branch.allowNegativeStock,
          isActive: branch.isActive,
        }}
      />
    </div>
  );
}

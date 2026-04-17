import { getSession } from '@/server/auth/session';
import { branchService } from '@/server/services/branch.service';
import { PageHeader } from '@/components/shared/page-header';
import { WarehouseForm } from '../warehouse-form';

export const metadata = { title: 'New warehouse' };

export default async function NewWarehousePage() {
  const session = await getSession();
  const branches = await branchService.listActive(session);
  return (
    <div>
      <PageHeader title="New warehouse" description="Add a stock location under a branch." />
      <WarehouseForm
        mode="create"
        branches={branches.map((b) => ({ id: b.id, name: b.name, code: b.code }))}
      />
    </div>
  );
}

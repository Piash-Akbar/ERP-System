import { getSession } from '@/server/auth/session';
import { warehouseService } from '@/server/services/warehouse.service';
import { branchService } from '@/server/services/branch.service';
import { PageHeader } from '@/components/shared/page-header';
import { WarehouseForm } from '../warehouse-form';

export const metadata = { title: 'Edit warehouse' };

export default async function EditWarehousePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  const [wh, branches] = await Promise.all([
    warehouseService.getById(session, id),
    branchService.listActive(session),
  ]);
  return (
    <div>
      <PageHeader title={wh.name} description={`${wh.branch.name} · ${wh.code}`} />
      <WarehouseForm
        mode="edit"
        initial={{
          id: wh.id,
          branchId: wh.branchId,
          code: wh.code,
          name: wh.name,
          type: wh.type,
          address: wh.address,
          isActive: wh.isActive,
        }}
        branches={branches.map((b) => ({ id: b.id, name: b.name, code: b.code }))}
      />
    </div>
  );
}

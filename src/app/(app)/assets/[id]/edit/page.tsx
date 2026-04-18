import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/shared/page-header';
import { prisma } from '@/server/db';
import { assetService } from '@/server/services/asset.service';
import { getSession } from '@/server/auth/session';
import { NotFoundError } from '@/lib/errors';
import { AssetForm } from '../../asset-form';

export const metadata = { title: 'Edit asset' };

export default async function EditAssetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  let asset: Awaited<ReturnType<typeof assetService.getById>>;
  try {
    asset = await assetService.getById(session, id);
  } catch (e) {
    if (e instanceof NotFoundError) notFound();
    throw e;
  }
  const [branches, categories] = await Promise.all([
    prisma.branch.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, code: true },
    }),
    prisma.assetCategory.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader title={`Edit ${asset.code}`} description={asset.name} />
      <AssetForm
        mode="edit"
        branches={branches}
        categories={categories}
        defaults={{
          id: asset.id,
          branchId: asset.branchId,
          categoryId: asset.categoryId,
          name: asset.name,
          description: asset.description,
          serialNumber: asset.serialNumber,
          location: asset.location,
          assignedTo: asset.assignedTo,
          condition: asset.condition,
          status: asset.status,
          purchaseDate: asset.purchaseDate.toISOString().slice(0, 10),
          purchaseCost: asset.purchaseCost.toString(),
          salvageValue: asset.salvageValue.toString(),
          usefulLifeMonths: asset.usefulLifeMonths,
          depreciationMethod: asset.depreciationMethod,
          notes: asset.notes,
        }}
      />
    </div>
  );
}

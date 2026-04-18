import { PageHeader } from '@/components/shared/page-header';
import { prisma } from '@/server/db';
import { AssetForm } from '../asset-form';

export const metadata = { title: 'New asset' };

export default async function NewAssetPage() {
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
      <PageHeader title="Add Asset" description="Register a new fixed asset" />
      <AssetForm mode="create" branches={branches} categories={categories} />
    </div>
  );
}

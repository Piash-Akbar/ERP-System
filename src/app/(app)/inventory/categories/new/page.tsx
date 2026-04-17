import { getSession } from '@/server/auth/session';
import { categoryService } from '@/server/services/product-category.service';
import { PageHeader } from '@/components/shared/page-header';
import { CategoryForm } from '../category-form';

export const metadata = { title: 'New category' };

export default async function NewCategoryPage() {
  const session = await getSession();
  const parents = await categoryService.listFlat(session);
  return (
    <div>
      <PageHeader title="New category" description="Create a product category." />
      <CategoryForm mode="create" parents={parents} />
    </div>
  );
}

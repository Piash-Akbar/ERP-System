import { getSession } from '@/server/auth/session';
import { categoryService } from '@/server/services/product-category.service';
import { PageHeader } from '@/components/shared/page-header';
import { CategoryForm } from '../category-form';

export const metadata = { title: 'Edit category' };

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  const [cat, parents] = await Promise.all([
    categoryService.getById(session, id),
    categoryService.listFlat(session),
  ]);
  return (
    <div>
      <PageHeader title={cat.name} description={cat.description ?? 'Edit category.'} />
      <CategoryForm
        mode="edit"
        initial={{ id: cat.id, name: cat.name, description: cat.description, parentId: cat.parentId }}
        parents={parents}
      />
    </div>
  );
}

import { PageHeader } from '@/components/shared/page-header';
import { BranchForm } from '../branch-form';

export const metadata = { title: 'New branch' };

export default function NewBranchPage() {
  return (
    <div>
      <PageHeader title="New branch" description="Create a new branch location." />
      <BranchForm mode="create" />
    </div>
  );
}

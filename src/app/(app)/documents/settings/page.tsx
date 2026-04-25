import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { getStorageSettings } from '@/server/storage';
import { StorageSettingsForm } from './settings-form';

export const metadata = { title: 'Document Storage Settings' };

export default async function DocumentStorageSettingsPage() {
  const settings = await getStorageSettings();
  const hasCredentials = !!process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Document storage"
        description="Choose where uploaded documents are stored — local disk or Google Drive."
      >
        <Button variant="outline" asChild>
          <Link href="/documents">
            <ChevronLeft className="h-4 w-4" /> Back
          </Link>
        </Button>
      </PageHeader>

      <StorageSettingsForm
        initialDriver={settings.driver}
        initialFolderId={settings.googleDriveFolderId}
        hasCredentials={hasCredentials}
      />
    </div>
  );
}

'use client';

import { useActionState, useTransition, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  saveStorageSettingsAction,
  testDriveConnectionAction,
  type StorageSettingsState,
} from '@/server/actions/storage-settings';

interface Props {
  initialDriver: 'local' | 'google-drive';
  initialFolderId: string;
  hasCredentials: boolean;
}

export function StorageSettingsForm({ initialDriver, initialFolderId, hasCredentials }: Props) {
  const [driver, setDriver] = useState<'local' | 'google-drive'>(initialDriver);
  const [folderId, setFolderId] = useState(initialFolderId);
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string } | null>(null);
  const [testing, startTest] = useTransition();

  const [state, action, pending] = useActionState<StorageSettingsState, FormData>(
    saveStorageSettingsAction,
    undefined,
  );

  function handleTest() {
    setTestResult(null);
    startTest(async () => {
      const result = await testDriveConnectionAction(folderId);
      setTestResult(result);
    });
  }

  return (
    <Card className="p-6 max-w-xl space-y-6">
      <form action={action} className="space-y-6">
        {/* Driver selection */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Storage backend</Label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="driver"
                value="local"
                checked={driver === 'local'}
                onChange={() => setDriver('local')}
                className="accent-blue-600"
              />
              <span className="text-sm">Local disk</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="driver"
                value="google-drive"
                checked={driver === 'google-drive'}
                onChange={() => setDriver('google-drive')}
                className="accent-blue-600"
              />
              <span className="text-sm">Google Drive</span>
            </label>
          </div>
          {driver === 'local' && (
            <p className="text-xs text-muted-foreground">
              Files are stored in <code>./storage/uploads/</code> on the server. Suitable for local
              or single-server deployments.
            </p>
          )}
        </div>

        {/* Google Drive options */}
        {driver === 'google-drive' && (
          <div className="space-y-4 rounded-lg border p-4">
            {!hasCredentials && (
              <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800">
                <strong>Service account credentials not detected.</strong> Set the{' '}
                <code>GOOGLE_SERVICE_ACCOUNT_JSON</code> environment variable to your service account
                key JSON before saving.
              </div>
            )}

            <div className="space-y-1">
              <Label htmlFor="folderId">Google Drive folder ID</Label>
              <Input
                id="folderId"
                name="googleDriveFolderId"
                value={folderId}
                onChange={(e) => setFolderId(e.target.value)}
                placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs"
              />
              <p className="text-xs text-muted-foreground">
                Open the folder in Google Drive. The ID is the last segment of the URL:{' '}
                <code>drive.google.com/drive/folders/&lt;FOLDER_ID&gt;</code>
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground">Setup checklist</div>
              <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Create a Google Cloud project and enable the Drive API.</li>
                <li>Create a service account and download the JSON key.</li>
                <li>
                  Set <code>GOOGLE_SERVICE_ACCOUNT_JSON</code> env var to the full key JSON.
                </li>
                <li>Share the target Drive folder with the service account email.</li>
                <li>Paste the folder ID above and click <strong>Test connection</strong>.</li>
              </ol>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!folderId || testing}
              onClick={handleTest}
            >
              {testing ? 'Testing…' : 'Test connection'}
            </Button>

            {testResult && (
              <div
                className={`rounded-md border p-3 text-xs ${
                  testResult.success
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                    : 'border-red-300 bg-red-50 text-red-700'
                }`}
              >
                {testResult.success
                  ? 'Connection successful — folder is accessible.'
                  : `Connection failed: ${testResult.error}`}
              </div>
            )}
          </div>
        )}

        {state?.error && (
          <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">
            {state.error}
          </div>
        )}
        {state?.success && (
          <div className="rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-800">
            Settings saved.
          </div>
        )}

        <Button type="submit" variant="dark" disabled={pending}>
          {pending ? 'Saving…' : 'Save settings'}
        </Button>
      </form>
    </Card>
  );
}

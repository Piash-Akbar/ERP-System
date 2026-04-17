import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { HiOutlineCog6Tooth, HiOutlineSignal, HiOutlineMapPin, HiOutlineAdjustmentsHorizontal } from 'react-icons/hi2';
import PageHeader from '../../components/PageHeader';
import { useWarehouse } from '../../context/WarehouseContext';
import { getWarehouseSettings, updateWarehouseSettings } from '../../services/warehouseOps.service';

const TABS = [
  { name: 'Scan Settings', icon: HiOutlineCog6Tooth },
  { name: 'Offline & Sync', icon: HiOutlineSignal },
  { name: 'Warehouse Locations', icon: HiOutlineMapPin },
  { name: 'General Settings', icon: HiOutlineAdjustmentsHorizontal },
];

const WarehouseOpsSettings = () => {
  const { selectedWarehouse, warehouses } = useWarehouse();
  const [activeTab, setActiveTab] = useState(0);
  const [settings, setSettings] = useState({
    scanSettings: { continuousScanMode: true, autoSubmit: false, soundFeedback: true },
    offlineSync: { enabled: false },
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [selectedWarehouse?._id]);

  const loadSettings = async () => {
    try {
      const res = await getWarehouseSettings({ warehouse: selectedWarehouse?._id });
      if (res.data.data) {
        setSettings({
          scanSettings: res.data.data.scanSettings || settings.scanSettings,
          offlineSync: res.data.data.offlineSync || settings.offlineSync,
        });
      }
    } catch {}
  };

  const handleSaveScan = async () => {
    setSaving(true);
    try {
      await updateWarehouseSettings({
        warehouse: selectedWarehouse?._id,
        scanSettings: settings.scanSettings,
      });
      toast.success('Scan settings saved');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const toggleScan = (field) => {
    setSettings((prev) => ({
      ...prev,
      scanSettings: { ...prev.scanSettings, [field]: !prev.scanSettings[field] },
    }));
  };

  return (
    <div>
      <PageHeader title="Warehouse Settings" subtitle="Configure warehouse operations and preferences" />

      {/* Tabs */}
      <div className="flex gap-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-1 mb-4 w-fit">
        {TABS.map((tab, i) => (
          <button
            key={tab.name}
            onClick={() => setActiveTab(i)}
            className={`px-4 py-2 text-xs font-medium rounded-md transition-colors ${
              activeTab === i
                ? 'bg-blue-500 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {/* Scan Settings */}
      {activeTab === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-6">Barcode Scan Behavior</h3>

          <div className="space-y-6">
            <ToggleRow
              icon="barcode"
              title="Continuous Scan Mode"
              description="Auto-focus on scan input after each scan for continuous scanning"
              checked={settings.scanSettings.continuousScanMode}
              onChange={() => toggleScan('continuousScanMode')}
            />
            <ToggleRow
              title="Auto-Submit After Scan"
              description="Automatically submit scanned barcode without requiring manual confirmation"
              checked={settings.scanSettings.autoSubmit}
              onChange={() => toggleScan('autoSubmit')}
            />
            <ToggleRow
              icon="sound"
              title="Sound Feedback"
              description="Play audio beep sound on successful/failed scans"
              checked={settings.scanSettings.soundFeedback}
              onChange={() => toggleScan('soundFeedback')}
            />
          </div>

          <div className="flex justify-end mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
            <button
              onClick={handleSaveScan}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Scan Settings'}
            </button>
          </div>
        </div>
      )}

      {/* Offline & Sync */}
      {activeTab === 1 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4">Offline & Sync</h3>
          <p className="text-sm text-gray-400">Offline mode will be available in a future update. This will allow warehouse operations to continue without an internet connection and sync when reconnected.</p>
        </div>
      )}

      {/* Warehouse Locations */}
      {activeTab === 2 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4">Warehouse Locations</h3>
          {warehouses.length === 0 ? (
            <p className="text-sm text-gray-400">No warehouses configured.</p>
          ) : (
            <div className="space-y-3">
              {warehouses.map((wh) => (
                <div
                  key={wh._id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    selectedWarehouse?._id === wh._id
                      ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-700'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{wh.name}</p>
                    <p className="text-xs text-gray-500">{wh.code} {wh.address ? `- ${wh.address}` : ''}</p>
                  </div>
                  {selectedWarehouse?._id === wh._id && (
                    <span className="text-xs text-blue-600 font-medium">Active</span>
                  )}
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-gray-400 mt-4">
            Manage warehouses from <a href="/locations/warehouses" className="text-blue-500 hover:underline">Location &gt; Warehouses</a>
          </p>
        </div>
      )}

      {/* General Settings */}
      {activeTab === 3 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4">General Settings</h3>
          <p className="text-sm text-gray-400">Additional warehouse settings will be added as the module grows.</p>
        </div>
      )}
    </div>
  );
};

const ToggleRow = ({ title, description, checked, onChange }) => (
  <div className="flex items-center justify-between">
    <div>
      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{title}</p>
      <p className="text-xs text-gray-500 mt-0.5">{description}</p>
    </div>
    <button
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  </div>
);

export default WarehouseOpsSettings;

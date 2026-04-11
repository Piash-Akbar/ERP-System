import { useState, useEffect } from 'react';
import FormInput from '../../components/FormInput';
import { getSettings, updateSettings } from '../../services/setting.service';
import toast from 'react-hot-toast';

const defaultSettings = {
  general: {
    company_name: '',
    currency: 'BDT',
    timezone: 'Asia/Dhaka',
  },
  invoice: {
    invoice_prefix: 'INV-',
    invoice_footer_text: '',
  },
  email: {
    smtp_host: '',
    smtp_port: '',
    smtp_user: '',
    smtp_password: '',
  },
};

const SettingsPage = () => {
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState({ general: false, invoice: false, email: false });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await getSettings();
        const data = res.data.data || [];
        const mapped = { ...defaultSettings };
        data.forEach((s) => {
          if (s.group && mapped[s.group] && s.key in mapped[s.group]) {
            mapped[s.group][s.key] = s.value;
          }
        });
        setSettings(mapped);
      } catch {
        // Use defaults
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (group, key, value) => {
    setSettings((prev) => ({
      ...prev,
      [group]: { ...prev[group], [key]: value },
    }));
  };

  const handleSave = async (group) => {
    setLoading((prev) => ({ ...prev, [group]: true }));
    try {
      const groupSettings = Object.entries(settings[group]).map(([key, value]) => ({
        key,
        value,
        group,
      }));
      await updateSettings(groupSettings);
      toast.success(`${group.charAt(0).toUpperCase() + group.slice(1)} settings saved`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save settings');
    } finally {
      setLoading((prev) => ({ ...prev, [group]: false }));
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage application settings</p>
      </div>

      {/* General Settings */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">General</h2>
        <div className="space-y-4">
          <FormInput
            label="Company Name"
            value={settings.general.company_name}
            onChange={(e) => handleChange('general', 'company_name', e.target.value)}
          />
          <FormInput
            label="Currency"
            value={settings.general.currency}
            onChange={(e) => handleChange('general', 'currency', e.target.value)}
          />
          <FormInput
            label="Timezone"
            value={settings.general.timezone}
            onChange={(e) => handleChange('general', 'timezone', e.target.value)}
          />
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => handleSave('general')}
            disabled={loading.general}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading.general ? 'Saving...' : 'Save General'}
          </button>
        </div>
      </div>

      {/* Invoice Settings */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Invoice</h2>
        <div className="space-y-4">
          <FormInput
            label="Invoice Prefix"
            value={settings.invoice.invoice_prefix}
            onChange={(e) => handleChange('invoice', 'invoice_prefix', e.target.value)}
          />
          <FormInput
            label="Footer Text"
            type="textarea"
            value={settings.invoice.invoice_footer_text}
            onChange={(e) => handleChange('invoice', 'invoice_footer_text', e.target.value)}
          />
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => handleSave('invoice')}
            disabled={loading.invoice}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading.invoice ? 'Saving...' : 'Save Invoice'}
          </button>
        </div>
      </div>

      {/* Email Settings */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Email</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="SMTP Host"
              value={settings.email.smtp_host}
              onChange={(e) => handleChange('email', 'smtp_host', e.target.value)}
            />
            <FormInput
              label="SMTP Port"
              value={settings.email.smtp_port}
              onChange={(e) => handleChange('email', 'smtp_port', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="SMTP User"
              value={settings.email.smtp_user}
              onChange={(e) => handleChange('email', 'smtp_user', e.target.value)}
            />
            <FormInput
              label="SMTP Password"
              type="password"
              value={settings.email.smtp_password}
              onChange={(e) => handleChange('email', 'smtp_password', e.target.value)}
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => handleSave('email')}
            disabled={loading.email}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading.email ? 'Saving...' : 'Save Email'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;

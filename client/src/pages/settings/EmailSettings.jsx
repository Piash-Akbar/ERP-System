import { useState } from 'react';
import toast from 'react-hot-toast';
import { HiOutlinePaperAirplane } from 'react-icons/hi2';
import PageHeader from '../../components/PageHeader';
import FormInput from '../../components/FormInput';

const EmailSettings = () => {
  const [form, setForm] = useState({
    smtpHost: 'smtp.gmail.com',
    smtpPort: '587',
    smtpUsername: 'your-email@gmail.com',
    smtpPassword: '',
    encryption: 'TLS',
    fromEmail: 'noreply@annexleather.com',
    fromName: 'Annex Leather',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleTestEmail = () => {
    toast.success('Test email sent successfully');
  };

  const handleSave = () => {
    toast.success('Email settings saved successfully');
  };

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader title="Email Settings" subtitle="Configure email server settings" />

      <div className="space-y-6">
        {/* Mail Driver */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Mail Driver</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                label="SMTP Host *"
                name="smtpHost"
                value={form.smtpHost}
                onChange={handleChange}
              />
              <FormInput
                label="SMTP Port *"
                name="smtpPort"
                value={form.smtpPort}
                onChange={handleChange}
              />
            </div>
            <FormInput
              label="SMTP Username *"
              name="smtpUsername"
              value={form.smtpUsername}
              onChange={handleChange}
            />
            <FormInput
              label="SMTP Password *"
              name="smtpPassword"
              type="password"
              value={form.smtpPassword}
              onChange={handleChange}
              placeholder="Enter SMTP password"
            />
            <FormInput
              label="Encryption"
              type="select"
              name="encryption"
              value={form.encryption}
              onChange={handleChange}
            >
              <option value="TLS">TLS</option>
              <option value="SSL">SSL</option>
              <option value="None">None</option>
            </FormInput>
          </div>
        </div>

        {/* Sender Information */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sender Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              label="From Email Address"
              name="fromEmail"
              type="email"
              value={form.fromEmail}
              onChange={handleChange}
            />
            <FormInput
              label="From Name *"
              name="fromName"
              value={form.fromName}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={handleTestEmail}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <HiOutlinePaperAirplane className="w-4 h-4" />
            Send Test Email
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailSettings;

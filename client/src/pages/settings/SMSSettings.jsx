import { useState } from 'react';
import toast from 'react-hot-toast';
import { HiOutlineDevicePhoneMobile } from 'react-icons/hi2';
import PageHeader from '../../components/PageHeader';
import FormInput from '../../components/FormInput';

const SMSSettings = () => {
  const [form, setForm] = useState({
    enableSMS: true,
    gateway: 'Twilio',
    accountSID: '****************************XXXX',
    authToken: '****************************XXXX',
    twilioPhone: '+1234567890',
    senderName: 'Annex Leather',
    senderID: 'ANNEXL',
    orderConfirmation: true,
    paymentConfirmation: true,
    deliveryNotification: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleTestSMS = () => {
    toast.success('Test SMS sent successfully');
  };

  const handleSave = () => {
    toast.success('SMS settings saved successfully');
  };

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader title="SMS Settings" subtitle="Configure SMS gateway and notifications" />

      <div className="space-y-6">
        {/* Enable SMS */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">SMS Notifications</h3>
              <p className="text-sm text-gray-500 mt-1">Enable or disable SMS notifications</p>
            </div>
            <div
              onClick={() => setForm((prev) => ({ ...prev, enableSMS: !prev.enableSMS }))}
              className={`relative w-11 h-6 rounded-full cursor-pointer transition-colors ${form.enableSMS ? 'bg-blue-600' : 'bg-gray-300'}`}
            >
              <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.enableSMS ? 'translate-x-5' : ''}`} />
            </div>
          </div>
        </div>

        {/* Gateway Selection */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">SMS Gateway</h3>
          <FormInput
            label="SMS Gateway"
            type="select"
            name="gateway"
            value={form.gateway}
            onChange={handleChange}
          >
            <option value="Twilio">Twilio</option>
            <option value="Nexmo">Nexmo</option>
            <option value="MSG91">MSG91</option>
            <option value="Custom">Custom</option>
          </FormInput>
        </div>

        {/* Twilio Configuration */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Twilio Configuration</h3>
          <div className="space-y-4">
            <FormInput
              label="Account SID *"
              name="accountSID"
              value={form.accountSID}
              onChange={handleChange}
            />
            <FormInput
              label="Auth Token *"
              name="authToken"
              type="password"
              value={form.authToken}
              onChange={handleChange}
            />
            <FormInput
              label="Twilio Phone Number *"
              name="twilioPhone"
              value={form.twilioPhone}
              onChange={handleChange}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                label="Sender Name"
                name="senderName"
                value={form.senderName}
                onChange={handleChange}
              />
              <FormInput
                label="Sender ID"
                name="senderID"
                value={form.senderID}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Settings</h3>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="orderConfirmation"
                checked={form.orderConfirmation}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Send order confirmation SMS</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="paymentConfirmation"
                checked={form.paymentConfirmation}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Send payment confirmation SMS</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="deliveryNotification"
                checked={form.deliveryNotification}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Send delivery notification SMS</span>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={handleTestSMS}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <HiOutlineDevicePhoneMobile className="w-4 h-4" />
            Send Test SMS
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

export default SMSSettings;

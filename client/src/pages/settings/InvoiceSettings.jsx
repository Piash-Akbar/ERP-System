import { useState } from 'react';
import toast from 'react-hot-toast';
import PageHeader from '../../components/PageHeader';
import FormInput from '../../components/FormInput';

const InvoiceSettings = () => {
  const [form, setForm] = useState({
    invoicePrefix: 'INV',
    invoiceStartNumber: '1001',
    quotationPrefix: 'QUO',
    quotationStartNumber: '1001',
    enableTax: true,
    taxLabel: 'Tax Rate (%)',
    taxRate: 'VAT',
    taxPercentage: '15',
    showLogo: true,
    showTerms: true,
    termsAndConditions: 'All goods remain the property of Annex Leather until full payment is received. Returns must be made within 15 days of delivery.',
    footerText: 'Thank you for choosing Annex Leather',
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSave = () => {
    toast.success('Invoice settings saved successfully');
  };

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader title="Invoice Settings" subtitle="Configure invoice and quotation settings" />

      <div className="space-y-6">
        {/* Invoice Numbering */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice Numbering</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              label="Invoice Prefix"
              name="invoicePrefix"
              value={form.invoicePrefix}
              onChange={handleChange}
            />
            <FormInput
              label="Starting Number"
              name="invoiceStartNumber"
              value={form.invoiceStartNumber}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Quotation Numbering */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quotation Numbering</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              label="Quotation Prefix"
              name="quotationPrefix"
              value={form.quotationPrefix}
              onChange={handleChange}
            />
            <FormInput
              label="Starting Number"
              name="quotationStartNumber"
              value={form.quotationStartNumber}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Tax Settings */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tax Settings</h3>
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setForm((prev) => ({ ...prev, enableTax: !prev.enableTax }))}
                className={`relative w-11 h-6 rounded-full transition-colors ${form.enableTax ? 'bg-blue-600' : 'bg-gray-300'}`}
              >
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.enableTax ? 'translate-x-5' : ''}`} />
              </div>
              <span className="text-sm font-medium text-gray-700">Enable Tax on Invoices</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                label="Tax Label"
                name="taxLabel"
                value={form.taxLabel}
                onChange={handleChange}
              />
              <FormInput
                label="Tax Rate"
                type="select"
                name="taxRate"
                value={form.taxRate}
                onChange={handleChange}
              >
                <option value="VAT">VAT</option>
                <option value="GST">GST</option>
                <option value="Sales Tax">Sales Tax</option>
              </FormInput>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                label="Tax %"
                name="taxPercentage"
                value={form.taxPercentage}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* Display Options */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Display Options</h3>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="showLogo"
                checked={form.showLogo}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Show Company Logo on Invoice</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="showTerms"
                checked={form.showTerms}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Show Terms and Conditions</span>
            </label>
          </div>
        </div>

        {/* Terms and Footer */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Terms and Footer</h3>
          <div className="space-y-4">
            <FormInput
              label="Terms and Conditions"
              type="textarea"
              name="termsAndConditions"
              value={form.termsAndConditions}
              onChange={handleChange}
            />
            <FormInput
              label="Footer Text"
              type="textarea"
              name="footerText"
              value={form.footerText}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
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

export default InvoiceSettings;

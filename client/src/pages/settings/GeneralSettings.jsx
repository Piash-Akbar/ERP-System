import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { HiOutlineCloudArrowUp, HiOutlineTrash, HiOutlineCheck } from 'react-icons/hi2';
import PageHeader from '../../components/PageHeader';
import FormInput from '../../components/FormInput';
import { useTheme } from '../../context/ThemeContext';
import { getSettings, updateSettings, uploadLogo as uploadLogoApi } from '../../services/setting.service';

const GeneralSettings = () => {
  const { companyName, setCompanyName, companyLogo, setCompanyLogo, appColor, updateColor, darkMode, toggleDarkMode, COLOR_PRESETS } = useTheme();
  const fileInputRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [logoPreview, setLogoPreview] = useState('');

  const [form, setForm] = useState({
    companyName: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    city: '',
    country: '',
    timezone: 'Asia/Dhaka',
    currency: 'BDT',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12 Hour',
  });

  // Load settings from backend
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data } = await getSettings();
        if (data.success) {
          const settingsMap = {};
          data.data.forEach((s) => { settingsMap[s.key] = s.value; });
          setForm((prev) => ({
            ...prev,
            companyName: settingsMap.company_name || prev.companyName,
            email: settingsMap.company_email || prev.email,
            phone: settingsMap.company_phone || prev.phone,
            website: settingsMap.company_website || prev.website,
            address: settingsMap.company_address || prev.address,
            city: settingsMap.company_city || prev.city,
            country: settingsMap.company_country || prev.country,
            timezone: settingsMap.timezone || prev.timezone,
            currency: settingsMap.currency || prev.currency,
            dateFormat: settingsMap.date_format || prev.dateFormat,
            timeFormat: settingsMap.time_format || prev.timeFormat,
          }));
        }
      } catch {
        // Use defaults
      }
    };
    loadSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo must be less than 2MB');
      return;
    }

    // Preview
    const reader = new FileReader();
    reader.onload = (ev) => setLogoPreview(ev.target.result);
    reader.readAsDataURL(file);

    // Upload
    setUploading(true);
    try {
      const { data } = await uploadLogoApi(file);
      if (data.success) {
        setCompanyLogo(data.data.url);
        setLogoPreview('');
        toast.success('Logo uploaded successfully');
      }
    } catch {
      toast.error('Failed to upload logo');
      setLogoPreview('');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveLogo = async () => {
    try {
      await updateSettings([{ key: 'company_logo', value: '', group: 'general' }]);
      setCompanyLogo('');
      toast.success('Logo removed');
    } catch {
      toast.error('Failed to remove logo');
    }
  };

  const handleColorChange = (colorName) => {
    updateColor(colorName);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const settings = [
        { key: 'company_name', value: form.companyName, group: 'general' },
        { key: 'company_email', value: form.email, group: 'general' },
        { key: 'company_phone', value: form.phone, group: 'general' },
        { key: 'company_website', value: form.website, group: 'general' },
        { key: 'company_address', value: form.address, group: 'general' },
        { key: 'company_city', value: form.city, group: 'general' },
        { key: 'company_country', value: form.country, group: 'general' },
        { key: 'timezone', value: form.timezone, group: 'general' },
        { key: 'currency', value: form.currency, group: 'general' },
        { key: 'date_format', value: form.dateFormat, group: 'general' },
        { key: 'time_format', value: form.timeFormat, group: 'general' },
        { key: 'app_color', value: appColor, group: 'general' },
        { key: 'dark_mode', value: darkMode, group: 'general' },
      ];
      await updateSettings(settings);
      setCompanyName(form.companyName);
      toast.success('General settings saved successfully');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const logoUrl = companyLogo || '';

  const colorOptions = [
    { name: 'orange', label: 'Orange' },
    { name: 'blue', label: 'Blue' },
    { name: 'green', label: 'Green' },
    { name: 'purple', label: 'Purple' },
    { name: 'red', label: 'Red' },
    { name: 'teal', label: 'Teal' },
    { name: 'indigo', label: 'Indigo' },
    { name: 'pink', label: 'Pink' },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader title="General Settings" subtitle="Configure general system settings" />

      <div className="space-y-6">
        {/* Company Logo */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Company Logo</h3>
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center overflow-hidden">
              {logoPreview ? (
                <img src={logoPreview} alt="Preview" className="w-full h-full object-cover rounded-xl" />
              ) : logoUrl ? (
                <img src={logoUrl} alt="Company Logo" className="w-full h-full object-cover rounded-xl" />
              ) : (
                <HiOutlineCloudArrowUp className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-lg hover:bg-primary-600 disabled:opacity-50"
                >
                  {uploading ? 'Uploading...' : 'Upload Logo'}
                </button>
                {logoUrl && (
                  <button
                    onClick={handleRemoveLogo}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                    title="Remove logo"
                  >
                    <HiOutlineTrash className="w-4 h-4" />
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">PNG, JPG, WebP, SVG up to 2MB. Recommended: 200x200px</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={handleLogoUpload}
                className="hidden"
              />
            </div>
          </div>
        </div>

        {/* Company Information */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Company Information</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                label="Company Name *"
                name="companyName"
                value={form.companyName}
                onChange={handleChange}
              />
              <FormInput
                label="Email *"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                label="Phone"
                name="phone"
                value={form.phone}
                onChange={handleChange}
              />
              <FormInput
                label="Website"
                name="website"
                value={form.website}
                onChange={handleChange}
              />
            </div>
            <FormInput
              label="Address"
              name="address"
              value={form.address}
              onChange={handleChange}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                label="City"
                name="city"
                value={form.city}
                onChange={handleChange}
              />
              <FormInput
                label="Country"
                name="country"
                value={form.country}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* App Color */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">App Color</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Choose a primary color for the application</p>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
            {colorOptions.map((color) => (
              <button
                key={color.name}
                onClick={() => handleColorChange(color.name)}
                className="group flex flex-col items-center gap-1.5"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    appColor === color.name
                      ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-gray-800'
                      : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: COLOR_PRESETS[color.name]?.[500] }}
                >
                  {appColor === color.name && (
                    <HiOutlineCheck className="w-5 h-5 text-white" />
                  )}
                </div>
                <span className="text-[11px] text-gray-500 dark:text-gray-400">{color.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Dark Mode */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Dark Mode</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Switch between light and dark appearance</p>
            </div>
            <button
              onClick={() => toggleDarkMode(!darkMode)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                darkMode ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  darkMode ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Regional Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Regional Settings</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                label="Timezone"
                type="select"
                name="timezone"
                value={form.timezone}
                onChange={handleChange}
              >
                <option value="Asia/Dhaka">Asia/Dhaka (GMT+6)</option>
                <option value="America/New_York">America/New_York (GMT-5)</option>
                <option value="Europe/London">Europe/London (GMT+0)</option>
                <option value="Asia/Dubai">Asia/Dubai (GMT+4)</option>
              </FormInput>
              <FormInput
                label="Currency"
                type="select"
                name="currency"
                value={form.currency}
                onChange={handleChange}
              >
                <option value="BDT">BDT - Bangladeshi Taka</option>
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
              </FormInput>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                label="Date Format"
                type="select"
                name="dateFormat"
                value={form.dateFormat}
                onChange={handleChange}
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </FormInput>
              <FormInput
                label="Time Format"
                type="select"
                name="timeFormat"
                value={form.timeFormat}
                onChange={handleChange}
              >
                <option value="12 Hour">12 Hour</option>
                <option value="24 Hour">24 Hour</option>
              </FormInput>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 text-sm font-medium text-white bg-primary-500 rounded-lg hover:bg-primary-600 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GeneralSettings;

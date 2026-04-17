import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import FormInput from '../../components/FormInput';
import PageHeader from '../../components/PageHeader';
import { createAsset, updateAsset, getAsset, getAssetCategories } from '../../services/asset.service';
import { getBranches } from '../../services/user.service';

const initialState = {
  name: '',
  description: '',
  category: '',
  purchaseDate: '',
  purchasePrice: '',
  salvageValue: '0',
  usefulLife: '',
  depreciationMethod: 'straight_line',
  depreciationRate: '',
  serialNumber: '',
  barcode: '',
  branch: '',
};

const AssetForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [categories, setCategories] = useState([]);
  const [branches, setBranches] = useState([]);

  useEffect(() => {
    loadOptions();
    if (isEdit) loadAsset();
  }, [id]);

  const loadOptions = async () => {
    try {
      const [catRes, branchRes] = await Promise.all([
        getAssetCategories({ limit: 100 }),
        getBranches({ limit: 100 }),
      ]);
      setCategories(catRes.data.data?.data || catRes.data.data || []);
      setBranches(branchRes.data.data?.data || branchRes.data.data || []);
    } catch {}
  };

  const loadAsset = async () => {
    try {
      const res = await getAsset(id);
      const a = res.data.data;
      setForm({
        name: a.name || '',
        description: a.description || '',
        category: a.category?._id || a.category || '',
        purchaseDate: a.purchaseDate ? a.purchaseDate.split('T')[0] : '',
        purchasePrice: a.purchasePrice || '',
        salvageValue: a.salvageValue || '0',
        usefulLife: a.usefulLife || '',
        depreciationMethod: a.depreciationMethod || 'straight_line',
        depreciationRate: a.depreciationRate || '',
        serialNumber: a.serialNumber || '',
        barcode: a.barcode || '',
        branch: a.branch?._id || a.branch || '',
      });
    } catch {
      toast.error('Failed to load asset');
      navigate('/assets');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Name is required';
    if (!form.category) newErrors.category = 'Category is required';
    if (!form.purchaseDate) newErrors.purchaseDate = 'Purchase date is required';
    if (!form.purchasePrice || Number(form.purchasePrice) < 0) newErrors.purchasePrice = 'Valid purchase price is required';
    if (!form.usefulLife || Number(form.usefulLife) < 1) newErrors.usefulLife = 'Useful life is required (months)';
    if (!form.depreciationMethod) newErrors.depreciationMethod = 'Method is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      ...form,
      purchasePrice: Number(form.purchasePrice),
      salvageValue: Number(form.salvageValue) || 0,
      usefulLife: Number(form.usefulLife),
      depreciationRate: form.depreciationRate ? Number(form.depreciationRate) : undefined,
    };
    if (!payload.branch) delete payload.branch;

    setLoading(true);
    try {
      if (isEdit) {
        await updateAsset(id, payload);
        toast.success('Asset updated');
      } else {
        await createAsset(payload);
        toast.success('Asset registered');
      }
      navigate('/assets');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader title={isEdit ? 'Edit Asset' : 'Register New Asset'} subtitle="Asset financial and assignment details" />

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormInput label="Asset Name" name="name" value={form.name} onChange={handleChange} error={errors.name} placeholder="e.g. MacBook Pro 16" />
          <FormInput label="Category" type="select" name="category" value={form.category} onChange={handleChange} error={errors.category}>
            <option value="">Select Category</option>
            {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </FormInput>
          <FormInput label="Branch" type="select" name="branch" value={form.branch} onChange={handleChange}>
            <option value="">No Branch</option>
            {branches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
          </FormInput>
        </div>

        <FormInput label="Description" name="description" value={form.description} onChange={handleChange} placeholder="Optional description" />

        <h3 className="text-sm font-semibold text-gray-700 pt-2">Financial Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormInput label="Purchase Date" type="date" name="purchaseDate" value={form.purchaseDate} onChange={handleChange} error={errors.purchaseDate} />
          <FormInput label="Purchase Price" type="number" name="purchasePrice" value={form.purchasePrice} onChange={handleChange} error={errors.purchasePrice} placeholder="0.00" min="0" />
          <FormInput label="Salvage Value" type="number" name="salvageValue" value={form.salvageValue} onChange={handleChange} placeholder="0.00" min="0" />
          <FormInput label="Useful Life (months)" type="number" name="usefulLife" value={form.usefulLife} onChange={handleChange} error={errors.usefulLife} placeholder="e.g. 60" min="1" />
          <FormInput label="Depreciation Method" type="select" name="depreciationMethod" value={form.depreciationMethod} onChange={handleChange} error={errors.depreciationMethod}>
            <option value="straight_line">Straight Line</option>
            <option value="declining_balance">Declining Balance</option>
            <option value="none">None</option>
          </FormInput>
          {form.depreciationMethod === 'declining_balance' && (
            <FormInput label="Depreciation Rate (%)" type="number" name="depreciationRate" value={form.depreciationRate} onChange={handleChange} placeholder="e.g. 20" min="0" max="100" />
          )}
        </div>

        <h3 className="text-sm font-semibold text-gray-700 pt-2">Identification</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput label="Serial Number" name="serialNumber" value={form.serialNumber} onChange={handleChange} placeholder="Optional" />
          <FormInput label="Barcode" name="barcode" value={form.barcode} onChange={handleChange} placeholder="Optional" />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button type="button" onClick={() => navigate('/assets')} className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Saving...' : isEdit ? 'Update Asset' : 'Register Asset'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AssetForm;

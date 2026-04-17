import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlinePencilSquare, HiOutlineTrash } from 'react-icons/hi2';
import useFetch from '../../hooks/useFetch';
import DataTable from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';
import FormInput from '../../components/FormInput';
import { getAssetCategories, createAssetCategory, updateAssetCategory, deleteAssetCategory } from '../../services/asset.service';

const initialState = {
  name: '',
  description: '',
  depreciationMethod: 'straight_line',
  defaultUsefulLife: '',
  defaultDepreciationRate: '',
  accountCode: '',
};

const AssetCategories = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { data, pagination, loading: fetchLoading, setPage, setSearch, refetch } = useFetch(getAssetCategories);
  const isEdit = Boolean(editing);

  useEffect(() => {
    if (editing) {
      setForm({
        name: editing.name || '',
        description: editing.description || '',
        depreciationMethod: editing.depreciationMethod || 'straight_line',
        defaultUsefulLife: editing.defaultUsefulLife || '',
        defaultDepreciationRate: editing.defaultDepreciationRate || '',
        accountCode: editing.accountCode || '',
      });
    } else {
      setForm(initialState);
    }
    setErrors({});
  }, [editing, modalOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setErrors({ name: 'Name is required' }); return; }

    const payload = {
      ...form,
      defaultUsefulLife: form.defaultUsefulLife ? Number(form.defaultUsefulLife) : undefined,
      defaultDepreciationRate: form.defaultDepreciationRate ? Number(form.defaultDepreciationRate) : undefined,
    };

    setLoading(true);
    try {
      if (isEdit) {
        await updateAssetCategory(editing._id, payload);
        toast.success('Category updated');
      } else {
        await createAssetCategory(payload);
        toast.success('Category created');
      }
      refetch();
      setModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (cat) => {
    if (!window.confirm(`Delete "${cat.name}"?`)) return;
    try {
      await deleteAssetCategory(cat._id);
      toast.success('Category deleted');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete');
    }
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'depreciationMethod', label: 'Method', render: (row) => <span className="capitalize">{row.depreciationMethod?.replace('_', ' ')}</span> },
    { key: 'defaultUsefulLife', label: 'Useful Life', render: (row) => row.defaultUsefulLife ? `${row.defaultUsefulLife} months` : '-' },
    { key: 'defaultDepreciationRate', label: 'Rate', render: (row) => row.defaultDepreciationRate ? `${row.defaultDepreciationRate}%` : '-' },
    { key: 'accountCode', label: 'Account Code', render: (row) => row.accountCode || '-' },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-1">
          <button onClick={() => { setEditing(row); setModalOpen(true); }} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-blue-600"><HiOutlinePencilSquare className="w-4 h-4" /></button>
          <button onClick={() => handleDelete(row)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-red-600"><HiOutlineTrash className="w-4 h-4" /></button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Asset Categories" subtitle="Manage asset classification">
        <button onClick={() => { setEditing(null); setModalOpen(true); }} className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
          <HiOutlinePlus className="w-4 h-4" /> Add Category
        </button>
      </PageHeader>

      <DataTable columns={columns} data={data || []} pagination={pagination} onPageChange={setPage} onSearch={setSearch} loading={fetchLoading} />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={isEdit ? 'Edit Category' : 'Add Category'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput label="Name" name="name" value={form.name} onChange={handleChange} error={errors.name} placeholder="e.g. Office Equipment" />
          <FormInput label="Description" name="description" value={form.description} onChange={handleChange} placeholder="Optional" />
          <FormInput label="Depreciation Method" type="select" name="depreciationMethod" value={form.depreciationMethod} onChange={handleChange}>
            <option value="straight_line">Straight Line</option>
            <option value="declining_balance">Declining Balance</option>
            <option value="none">None</option>
          </FormInput>
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="Default Useful Life (months)" type="number" name="defaultUsefulLife" value={form.defaultUsefulLife} onChange={handleChange} min="1" />
            <FormInput label="Default Rate (%)" type="number" name="defaultDepreciationRate" value={form.defaultDepreciationRate} onChange={handleChange} min="0" max="100" />
          </div>
          <FormInput label="Account Code" name="accountCode" value={form.accountCode} onChange={handleChange} placeholder="COA code" />
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2.5 text-sm text-white bg-blue-600 rounded-lg disabled:opacity-50">
              {loading ? 'Saving...' : isEdit ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AssetCategories;

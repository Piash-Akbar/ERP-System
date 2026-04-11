import { useState } from 'react';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlinePencilSquare, HiOutlineTrash } from 'react-icons/hi2';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import FormInput from '../../components/FormInput';

const initialCountries = [
  { _id: '1', flag: '\u{1F1E7}\u{1F1E9}', name: 'Bangladesh', code: 'BD', currency: 'BDT', phoneCode: '+880', status: 'Active' },
  { _id: '2', flag: '\u{1F1FA}\u{1F1F8}', name: 'United States', code: 'US', currency: 'USD', phoneCode: '+1', status: 'Active' },
  { _id: '3', flag: '\u{1F1EC}\u{1F1E7}', name: 'United Kingdom', code: 'GB', currency: 'GBP', phoneCode: '+44', status: 'Active' },
];

const initialForm = { name: '', code: '', currency: '', phoneCode: '', status: 'Active' };

const CountryManagement = () => {
  const [countries, setCountries] = useState(initialCountries);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [editId, setEditId] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.code) {
      toast.error('Country Name and Code are required');
      return;
    }
    if (editId) {
      setCountries((prev) => prev.map((c) => (c._id === editId ? { ...c, ...form } : c)));
      toast.success('Country updated successfully');
    } else {
      setCountries((prev) => [...prev, { ...form, _id: String(Date.now()), flag: '\u{1F3F3}\u{FE0F}' }]);
      toast.success('Country added successfully');
    }
    setModalOpen(false);
    setForm(initialForm);
    setEditId(null);
  };

  const handleEdit = (row) => {
    setForm({ name: row.name, code: row.code, currency: row.currency, phoneCode: row.phoneCode, status: row.status });
    setEditId(row._id);
    setModalOpen(true);
  };

  const handleDelete = (row) => {
    if (!window.confirm('Delete this country?')) return;
    setCountries((prev) => prev.filter((c) => c._id !== row._id));
    toast.success('Country deleted successfully');
  };

  const columns = [
    { key: 'flag', label: 'FLAG', render: (row) => <span className="text-2xl">{row.flag}</span> },
    { key: 'name', label: 'COUNTRY NAME', render: (row) => <span className="font-medium text-gray-900">{row.name}</span> },
    { key: 'code', label: 'CODE' },
    { key: 'currency', label: 'CURRENCY' },
    { key: 'phoneCode', label: 'PHONE CODE' },
    {
      key: 'status',
      label: 'STATUS',
      render: (row) => <StatusBadge color="green">{row.status}</StatusBadge>,
    },
    {
      key: 'actions',
      label: 'ACTIONS',
      render: (row) => (
        <div className="flex items-center gap-1">
          <button onClick={() => handleEdit(row)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-blue-600" title="Edit">
            <HiOutlinePencilSquare className="w-4 h-4" />
          </button>
          <button onClick={() => handleDelete(row)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-red-600" title="Delete">
            <HiOutlineTrash className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Country Management" subtitle="Manage countries and currencies">
        <button
          onClick={() => { setForm(initialForm); setEditId(null); setModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600"
        >
          <HiOutlinePlus className="w-4 h-4" />
          Add Country
        </button>
      </PageHeader>

      <DataTable columns={columns} data={countries} onSearch={() => {}} />

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditId(null); }} title={editId ? 'Edit Country' : 'Add Country'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput label="Country Name *" name="name" value={form.name} onChange={handleChange} placeholder="e.g. Bangladesh" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput label="Country Code *" name="code" value={form.code} onChange={handleChange} placeholder="e.g. BD" />
            <FormInput label="Currency" name="currency" value={form.currency} onChange={handleChange} placeholder="e.g. BDT" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput label="Phone Code" name="phoneCode" value={form.phoneCode} onChange={handleChange} placeholder="e.g. +880" />
            <FormInput label="Status" type="select" name="status" value={form.status} onChange={handleChange}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </FormInput>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={() => { setModalOpen(false); setEditId(null); }} className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2.5 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600">
              {editId ? 'Update Country' : 'Add Country'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CountryManagement;

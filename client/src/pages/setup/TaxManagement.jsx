import { useState } from 'react';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlinePencilSquare, HiOutlineTrash } from 'react-icons/hi2';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import FormInput from '../../components/FormInput';

const initialTaxes = [
  { _id: '1', name: 'VAT', rate: 15, type: 'Percentage', appliesTo: 'All Products', description: 'Value Added Tax' },
  { _id: '2', name: 'Service Tax', rate: 10, type: 'Percentage', appliesTo: 'Services', description: 'Tax on services' },
  { _id: '3', name: 'Import Duty', rate: 25, type: 'Percentage', appliesTo: 'Imported Goods', description: 'Tax on imported goods' },
];

const initialForm = { name: '', rate: '', type: 'Percentage', appliesTo: '', description: '' };

const TaxManagement = () => {
  const [taxes, setTaxes] = useState(initialTaxes);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [editId, setEditId] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.rate) {
      toast.error('Name and Rate are required');
      return;
    }
    if (editId) {
      setTaxes((prev) => prev.map((t) => (t._id === editId ? { ...t, ...form, rate: Number(form.rate) } : t)));
      toast.success('Tax updated successfully');
    } else {
      setTaxes((prev) => [...prev, { ...form, _id: String(Date.now()), rate: Number(form.rate) }]);
      toast.success('Tax added successfully');
    }
    setModalOpen(false);
    setForm(initialForm);
    setEditId(null);
  };

  const handleEdit = (row) => {
    setForm({ name: row.name, rate: String(row.rate), type: row.type, appliesTo: row.appliesTo, description: row.description });
    setEditId(row._id);
    setModalOpen(true);
  };

  const handleDelete = (row) => {
    if (!window.confirm('Delete this tax?')) return;
    setTaxes((prev) => prev.filter((t) => t._id !== row._id));
    toast.success('Tax deleted successfully');
  };

  const columns = [
    { key: 'index', label: '#', render: (_, i) => i + 1 },
    { key: 'name', label: 'TAX NAME', render: (row) => <span className="font-medium text-gray-900">{row.name}</span> },
    { key: 'rate', label: 'RATE', render: (row) => `${row.rate}%` },
    { key: 'type', label: 'TYPE', render: (row) => <StatusBadge color="blue">{row.type}</StatusBadge> },
    { key: 'appliesTo', label: 'APPLIES TO', render: (row) => row.appliesTo || '-' },
    { key: 'description', label: 'DESCRIPTION', render: (row) => row.description || '-' },
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
      <PageHeader title="Tax Management" subtitle="Manage tax rates and types">
        <button
          onClick={() => { setForm(initialForm); setEditId(null); setModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600"
        >
          <HiOutlinePlus className="w-4 h-4" />
          Add Tax
        </button>
      </PageHeader>

      <DataTable columns={columns} data={taxes} onSearch={() => {}} />

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditId(null); }} title={editId ? 'Edit Tax' : 'Add Tax'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput label="Tax Name *" name="name" value={form.name} onChange={handleChange} placeholder="e.g. VAT" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput label="Rate (%)" name="rate" type="number" value={form.rate} onChange={handleChange} placeholder="15" min="0" step="0.01" />
            <FormInput label="Type" type="select" name="type" value={form.type} onChange={handleChange}>
              <option value="Percentage">Percentage</option>
              <option value="Fixed">Fixed</option>
            </FormInput>
          </div>
          <FormInput label="Applies To" name="appliesTo" value={form.appliesTo} onChange={handleChange} placeholder="e.g. All Products" />
          <FormInput label="Description" name="description" value={form.description} onChange={handleChange} placeholder="Tax description" />
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={() => { setModalOpen(false); setEditId(null); }} className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2.5 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600">
              {editId ? 'Update Tax' : 'Add Tax'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TaxManagement;

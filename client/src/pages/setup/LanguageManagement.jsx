import { useState } from 'react';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlinePencilSquare, HiOutlineTrash } from 'react-icons/hi2';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import FormInput from '../../components/FormInput';

const initialLanguages = [
  { _id: '1', name: 'English', code: 'EN', direction: 'LTR', status: 'Default' },
  { _id: '2', name: 'Bengali', code: 'BN', direction: 'LTR', status: 'Active' },
  { _id: '3', name: 'Arabic', code: 'AR', direction: 'RTL', status: 'Active' },
];

const initialForm = { name: '', code: '', direction: 'LTR', status: 'Active' };

const LanguageManagement = () => {
  const [languages, setLanguages] = useState(initialLanguages);
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
      toast.error('Language Name and Code are required');
      return;
    }
    if (editId) {
      setLanguages((prev) => prev.map((l) => (l._id === editId ? { ...l, ...form } : l)));
      toast.success('Language updated successfully');
    } else {
      setLanguages((prev) => [...prev, { ...form, _id: String(Date.now()) }]);
      toast.success('Language added successfully');
    }
    setModalOpen(false);
    setForm(initialForm);
    setEditId(null);
  };

  const handleEdit = (row) => {
    setForm({ name: row.name, code: row.code, direction: row.direction, status: row.status });
    setEditId(row._id);
    setModalOpen(true);
  };

  const handleDelete = (row) => {
    if (row.status === 'Default') {
      toast.error('Cannot delete the default language');
      return;
    }
    if (!window.confirm('Delete this language?')) return;
    setLanguages((prev) => prev.filter((l) => l._id !== row._id));
    toast.success('Language deleted successfully');
  };

  const columns = [
    { key: 'name', label: 'LANGUAGE NAME', render: (row) => <span className="font-medium text-gray-900">{row.name}</span> },
    { key: 'code', label: 'CODE' },
    { key: 'direction', label: 'DIRECTION' },
    {
      key: 'status',
      label: 'STATUS',
      render: (row) => (
        <StatusBadge color={row.status === 'Default' ? 'blue' : 'green'}>
          {row.status}
        </StatusBadge>
      ),
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
      <PageHeader title="Language Management" subtitle="Manage system languages">
        <button
          onClick={() => { setForm(initialForm); setEditId(null); setModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600"
        >
          <HiOutlinePlus className="w-4 h-4" />
          Add Language
        </button>
      </PageHeader>

      <DataTable columns={columns} data={languages} onSearch={() => {}} />

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditId(null); }} title={editId ? 'Edit Language' : 'Add Language'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput label="Language Name *" name="name" value={form.name} onChange={handleChange} placeholder="e.g. English" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput label="Language Code *" name="code" value={form.code} onChange={handleChange} placeholder="e.g. EN" />
            <FormInput label="Direction" type="select" name="direction" value={form.direction} onChange={handleChange}>
              <option value="LTR">LTR (Left to Right)</option>
              <option value="RTL">RTL (Right to Left)</option>
            </FormInput>
          </div>
          <FormInput label="Status" type="select" name="status" value={form.status} onChange={handleChange}>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Default">Default</option>
          </FormInput>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={() => { setModalOpen(false); setEditId(null); }} className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2.5 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600">
              {editId ? 'Update Language' : 'Add Language'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default LanguageManagement;

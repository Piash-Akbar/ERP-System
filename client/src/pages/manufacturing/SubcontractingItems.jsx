import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { HiOutlinePencilSquare, HiOutlineTrash } from 'react-icons/hi2';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';
import FormInput from '../../components/FormInput';
import useFetch from '../../hooks/useFetch';
import { getSubcontractingItems, createSubcontractingItem, deleteSubcontractingItem } from '../../services/manufacturing.service';
import { getContacts } from '../../services/contact.service';

const SubcontractingItems = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', category: '', processType: '', supplier: '', unitCost: '' });

  const { data, pagination, loading, setPage, setSearch, refetch } = useFetch(getSubcontractingItems);

  useEffect(() => {
    getContacts({ type: 'supplier', limit: 100 }).then((res) => setSuppliers(res.data.data?.data || res.data.data || [])).catch(() => {});
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete?')) return;
    try { await deleteSubcontractingItem(id); toast.success('Deleted'); refetch(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) return toast.error('Name is required');
    setSaving(true);
    try {
      await createSubcontractingItem({ ...form, unitCost: Number(form.unitCost) || 0 });
      toast.success('Item added'); setModalOpen(false);
      setForm({ name: '', category: '', processType: '', supplier: '', unitCost: '' });
      refetch();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };

  const items = data || [];

  return (
    <div>
      <PageHeader title="Subcontracting Items" subtitle="Manage items and services for subcontracting">
        <button onClick={() => setModalOpen(true)} className="px-4 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600">+ Add Item</button>
      </PageHeader>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <input type="text" placeholder="Search items..." onChange={(e) => setSearch(e.target.value)} className="pl-3 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 w-64" />
        </div>
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50 border-b border-gray-200">
            <th className="text-left px-4 py-3 font-medium text-gray-600">ITEM NAME</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">CATEGORY</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">PROCESS TYPE</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">SUPPLIER</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">UNIT COST</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">ACTIONS</th>
          </tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={6} className="text-center py-12 text-gray-400">Loading...</td></tr>
            : items.length === 0 ? <tr><td colSpan={6} className="text-center py-12 text-gray-400">No items found</td></tr>
            : items.map((i) => (
              <tr key={i._id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{i.name}</td>
                <td className="px-4 py-3 text-gray-700">{i.category || '-'}</td>
                <td className="px-4 py-3 text-gray-700">{i.processType || '-'}</td>
                <td className="px-4 py-3 text-gray-700">{i.supplier?.name || '-'}</td>
                <td className="px-4 py-3 font-medium text-gray-900">৳{(i.unitCost || 0).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <button onClick={() => handleDelete(i._id)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-500 hover:text-red-600"><HiOutlineTrash className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add Subcontracting Item" size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput label="Item/Service Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Leather Stitching" />
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="Category" type="select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option value="">Select</option>
              <option value="Assembly">Assembly</option><option value="Fitting">Fitting</option><option value="Finishing">Finishing</option><option value="Branding">Branding</option>
            </FormInput>
            <FormInput label="Process Type" value={form.processType} onChange={(e) => setForm({ ...form, processType: e.target.value })} placeholder="e.g. Stitching" />
          </div>
          <FormInput label="Supplier" type="select" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })}>
            <option value="">Select supplier</option>
            {suppliers.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
          </FormInput>
          <FormInput label="Unit Cost" type="number" value={form.unitCost} onChange={(e) => setForm({ ...form, unitCost: e.target.value })} placeholder="0" min="0" />
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2.5 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50">{saving ? 'Adding...' : 'Add Item'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SubcontractingItems;

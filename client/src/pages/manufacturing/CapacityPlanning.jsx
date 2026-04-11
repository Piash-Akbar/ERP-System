import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { HiOutlineTrash, HiOutlinePencilSquare } from 'react-icons/hi2';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import FormInput from '../../components/FormInput';
import { getCapacitySummary, getWorkCenters, createWorkCenter, updateWorkCenter, deleteWorkCenter } from '../../services/manufacturing.service';

const CapacityPlanning = () => {
  const [capacity, setCapacity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', capacity: '', unit: 'units/day', description: '' });

  const loadData = () => {
    setLoading(true);
    getCapacitySummary()
      .then((res) => setCapacity(res.data.data || []))
      .catch(() => setCapacity([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const getStatusInfo = (utilization) => {
    if (utilization >= 95) return { label: 'Critical', color: 'red', bar: 'bg-red-500' };
    if (utilization >= 85) return { label: 'Warning', color: 'yellow', bar: 'bg-yellow-500' };
    return { label: 'Normal', color: 'green', bar: 'bg-green-500' };
  };

  const avgUtil = capacity.length > 0 ? Math.round(capacity.reduce((s, c) => s + (c.utilization || 0), 0) / capacity.length) : 0;
  const alerts = capacity.filter((c) => (c.utilization || 0) >= 85).length;

  const resetForm = () => {
    setForm({ name: '', capacity: '', unit: 'units/day', description: '' });
    setEditingId(null);
  };

  const openCreate = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEdit = async (wc) => {
    setForm({ name: wc.name, capacity: wc.capacity, unit: wc.unit || 'units/day', description: '' });
    setEditingId(wc._id);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.capacity) return toast.error('Name and capacity are required');
    setSaving(true);
    try {
      if (editingId) {
        await updateWorkCenter(editingId, { ...form, capacity: Number(form.capacity) });
        toast.success('Work center updated');
      } else {
        await createWorkCenter({ ...form, capacity: Number(form.capacity) });
        toast.success('Work center created');
      }
      setModalOpen(false);
      resetForm();
      loadData();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this work center?')) return;
    try { await deleteWorkCenter(id); toast.success('Deleted'); loadData(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  return (
    <div>
      <PageHeader title="Capacity Planning" subtitle="Monitor and manage production capacity">
        <button onClick={openCreate} className="px-4 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600">+ Add Work Center</button>
      </PageHeader>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4"><p className="text-xs text-gray-500">Total Alerts</p><p className="text-2xl font-bold text-orange-600 mt-1">{alerts}</p></div>
        <div className="bg-white rounded-xl border border-gray-200 p-4"><p className="text-xs text-gray-500">Avg Utilization</p><p className="text-2xl font-bold text-green-600 mt-1">{avgUtil}%</p></div>
        <div className="bg-white rounded-xl border border-gray-200 p-4"><p className="text-xs text-gray-500">Work Centers</p><p className="text-2xl font-bold text-blue-600 mt-1">{capacity.length}</p></div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-5 border-b border-gray-200"><h3 className="text-sm font-semibold text-gray-800">Work Center Capacity</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 font-medium text-gray-600">WORK CENTER</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">CAPACITY</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">ALLOCATED</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">UTILIZATION</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">AVAILABLE</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">STATUS</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">ACTIONS</th>
            </tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={7} className="text-center py-12 text-gray-400">Loading...</td></tr>
              : capacity.length === 0 ? <tr><td colSpan={7} className="text-center py-12 text-gray-400">No work centers yet. Add a work center to start tracking capacity.</td></tr>
              : capacity.map((c) => {
                const info = getStatusInfo(c.utilization || 0);
                return (
                  <tr key={c._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                    <td className="px-4 py-3 text-gray-700">{c.capacity} <span className="text-xs text-gray-400">{c.unit}</span></td>
                    <td className="px-4 py-3 text-gray-700">{c.allocated}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2"><div className={`${info.bar} h-2 rounded-full`} style={{ width: `${Math.min(c.utilization, 100)}%` }}></div></div>
                        <span className="text-xs font-medium">{c.utilization}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{c.available}</td>
                    <td className="px-4 py-3"><StatusBadge color={info.color}>{info.label}</StatusBadge></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(c)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-blue-600"><HiOutlinePencilSquare className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(c._id)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-500 hover:text-red-600"><HiOutlineTrash className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Work Center Modal */}
      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); resetForm(); }} title={editingId ? 'Edit Work Center' : 'Add Work Center'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput label="Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Cutting Station A" />
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="Capacity *" type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} placeholder="100" min="1" />
            <FormInput label="Unit" type="select" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
              <option value="units/day">Units / Day</option>
              <option value="units/week">Units / Week</option>
              <option value="units/month">Units / Month</option>
              <option value="hours/day">Hours / Day</option>
            </FormInput>
          </div>
          <FormInput label="Description" type="textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional description..." />
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={() => { setModalOpen(false); resetForm(); }} className="px-4 py-2.5 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50">{saving ? 'Saving...' : editingId ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CapacityPlanning;

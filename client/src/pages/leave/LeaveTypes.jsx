import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { HiOutlinePencilSquare, HiOutlineTrash } from 'react-icons/hi2';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';
import FormInput from '../../components/FormInput';
import { getLeaveTypes, createLeaveType, updateLeaveType, deleteLeaveType } from '../../services/leave.service';

const colors = ['bg-blue-500', 'bg-red-500', 'bg-green-500', 'bg-orange-500', 'bg-purple-500', 'bg-teal-500'];

const LeaveTypes = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', daysAllowed: '', carryForward: false, maxCarryForwardDays: '', isPaid: true, description: '' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getLeaveTypes();
      setData(res.data.data || []);
    } catch {
      toast.error('Failed to load leave types');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', daysAllowed: '', carryForward: false, maxCarryForwardDays: '', isPaid: true, description: '' });
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      name: item.name || '',
      daysAllowed: item.daysAllowed || '',
      carryForward: item.carryForward || false,
      maxCarryForwardDays: item.maxCarryForwardDays || '',
      isPaid: item.isPaid !== false,
      description: item.description || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) return toast.error('Name is required');
    if (!form.daysAllowed || Number(form.daysAllowed) <= 0) return toast.error('Days allowed must be > 0');

    setSaving(true);
    try {
      const payload = {
        name: form.name,
        daysAllowed: Number(form.daysAllowed),
        carryForward: form.carryForward,
        maxCarryForwardDays: form.carryForward ? Number(form.maxCarryForwardDays) || 0 : 0,
        isPaid: form.isPaid,
      };
      if (editing) {
        await updateLeaveType(editing._id, payload);
        toast.success('Leave type updated');
      } else {
        await createLeaveType(payload);
        toast.success('Leave type created');
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this leave type?')) return;
    try {
      await deleteLeaveType(id);
      toast.success('Leave type deleted');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete');
    }
  };

  return (
    <div>
      <PageHeader title="Leave Types" subtitle="Manage leave type configurations">
        <button onClick={openAdd} className="px-4 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600">+ Add Leave Type</button>
      </PageHeader>

      <div className="bg-white rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 font-medium text-gray-600">#</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">LEAVE TYPE</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">DAYS ALLOWED</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">CARRY FORWARD</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">PAID</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-12 text-gray-400">Loading...</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-gray-400">No leave types found</td></tr>
            ) : (
              data.map((d, i) => (
                <tr key={d._id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${colors[i % colors.length]}`}></span>
                      <span className="font-medium text-gray-900">{d.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{d.daysAllowed} days</td>
                  <td className="px-4 py-3 text-gray-700">{d.carryForward ? `Yes (max ${d.maxCarryForwardDays || 0})` : 'No'}</td>
                  <td className="px-4 py-3 text-gray-700">{d.isPaid !== false ? 'Yes' : 'No'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(d)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-blue-600"><HiOutlinePencilSquare className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(d._id)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-red-600"><HiOutlineTrash className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Leave Type' : 'Add Leave Type'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput label="Leave Type Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Annual Leave" />
          <FormInput label="Days Allowed *" type="number" value={form.daysAllowed} onChange={(e) => setForm({ ...form, daysAllowed: e.target.value })} min="1" />
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={form.carryForward} onChange={(e) => setForm({ ...form, carryForward: e.target.checked })} className="w-4 h-4 text-orange-600 border-gray-300 rounded" id="carryFwd" />
            <label htmlFor="carryFwd" className="text-sm text-gray-700">Allow Carry Forward</label>
          </div>
          {form.carryForward && (
            <FormInput label="Max Carry Forward Days" type="number" value={form.maxCarryForwardDays} onChange={(e) => setForm({ ...form, maxCarryForwardDays: e.target.value })} min="0" />
          )}
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={form.isPaid} onChange={(e) => setForm({ ...form, isPaid: e.target.checked })} className="w-4 h-4 text-orange-600 border-gray-300 rounded" id="isPaid" />
            <label htmlFor="isPaid" className="text-sm text-gray-700">Paid Leave</label>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2.5 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50">
              {saving ? 'Saving...' : editing ? 'Update' : 'Add Leave Type'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default LeaveTypes;

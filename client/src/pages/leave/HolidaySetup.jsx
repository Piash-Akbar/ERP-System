import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { HiOutlineTrash } from 'react-icons/hi2';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import FormInput from '../../components/FormInput';
import { getHolidays, createHoliday, deleteHoliday } from '../../services/leave.service';

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const HolidaySetup = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', date: '', isRecurring: false });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getHolidays();
      setData(res.data.data || []);
    } catch {
      toast.error('Failed to load holidays');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.date) return toast.error('Name and date are required');

    setSaving(true);
    try {
      await createHoliday({
        name: form.name,
        date: form.date,
        isRecurring: form.isRecurring,
      });
      toast.success('Holiday added');
      setModalOpen(false);
      setForm({ name: '', date: '', isRecurring: false });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add holiday');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this holiday?')) return;
    try {
      await deleteHoliday(id);
      toast.success('Holiday deleted');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete');
    }
  };

  return (
    <div>
      <PageHeader title="Holiday Setup" subtitle="Manage public and optional holidays">
        <button onClick={() => setModalOpen(true)} className="px-4 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600">+ Add Holiday</button>
      </PageHeader>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-600">HOLIDAY NAME</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">DATE</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">DAY</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">TYPE</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-12 text-gray-400">Loading...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-gray-400">No holidays found</td></tr>
              ) : (
                data.map((h) => {
                  const d = new Date(h.date);
                  return (
                    <tr key={h._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{h.name}</td>
                      <td className="px-4 py-3 text-gray-700">{d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                      <td className="px-4 py-3 text-gray-700">{dayNames[d.getDay()]}</td>
                      <td className="px-4 py-3">
                        <StatusBadge color={h.isRecurring ? 'blue' : 'purple'}>
                          {h.isRecurring ? 'Public' : 'Occasional'}
                        </StatusBadge>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => handleDelete(h._id)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-500 hover:text-red-600">
                          <HiOutlineTrash className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add Holiday" size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput label="Holiday Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Independence Day" />
          <FormInput label="Date *" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={form.isRecurring} onChange={(e) => setForm({ ...form, isRecurring: e.target.checked })} className="w-4 h-4 text-orange-600 border-gray-300 rounded" id="recurring" />
            <label htmlFor="recurring" className="text-sm text-gray-700">Recurring (Public Holiday)</label>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2.5 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50">
              {saving ? 'Adding...' : 'Add Holiday'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default HolidaySetup;

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { HiOutlinePlus } from 'react-icons/hi2';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import FormInput from '../../components/FormInput';
import useFetch from '../../hooks/useFetch';
import { getLoans, createLoan, getStaff } from '../../services/hrm.service';

const statusColors = { active: 'blue', completed: 'green', pending: 'yellow' };
const fmt = (n) => `৳${(n || 0).toLocaleString()}`;

const StaffLoans = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [staffList, setStaffList] = useState([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ staff: '', amount: '', monthlyDeduction: '', reason: '' });

  const { data, pagination, loading, setPage, setSearch, refetch } = useFetch(getLoans);

  useEffect(() => {
    getStaff({ limit: 200 }).then((res) => {
      setStaffList(res.data.data?.data || res.data.data || []);
    }).catch(() => toast.error('Something went wrong'));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.staff) return toast.error('Select a staff member');
    if (!form.amount || Number(form.amount) <= 0) return toast.error('Enter a valid amount');
    if (!form.monthlyDeduction || Number(form.monthlyDeduction) <= 0) return toast.error('Enter monthly deduction');

    setSaving(true);
    try {
      await createLoan({
        staff: form.staff,
        amount: Number(form.amount),
        monthlyDeduction: Number(form.monthlyDeduction),
        reason: form.reason,
      });
      toast.success('Loan created successfully');
      setModalOpen(false);
      setForm({ staff: '', amount: '', monthlyDeduction: '', reason: '' });
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create loan');
    } finally {
      setSaving(false);
    }
  };

  const loans = data || [];
  const totalLoans = loans.reduce((sum, l) => sum + (l.amount || 0), 0);
  const totalRemaining = loans.reduce((sum, l) => sum + (l.remainingBalance || 0), 0);
  const activeCount = loans.filter((l) => l.status === 'active').length;

  return (
    <div>
      <PageHeader title="Staff Loans" subtitle="Manage employee loans and advances">
        <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600">
          <HiOutlinePlus className="w-4 h-4" /> Add Loan
        </button>
      </PageHeader>

      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Total Loans</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{fmt(totalLoans)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Remaining</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">{fmt(totalRemaining)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Active Loans</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{activeCount}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <div className="p-4 border-b border-gray-200">
          <input type="text" placeholder="Search loans..." onChange={(e) => setSearch(e.target.value)} className="pl-3 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 w-64" />
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 font-medium text-gray-600">EMPLOYEE</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">LOAN AMOUNT</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">MONTHLY DED.</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">TOTAL PAID</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">REMAINING</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">REASON</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">STATUS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-12 text-gray-400">Loading...</td></tr>
            ) : loans.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12 text-gray-400">No loans found</td></tr>
            ) : (
              loans.map((l) => (
                <tr key={l._id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900">{l.staff?.user?.name || '-'}</p>
                      <p className="text-xs text-gray-500">{l.staff?.employeeId}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{fmt(l.amount)}</td>
                  <td className="px-4 py-3 text-gray-700">{fmt(l.monthlyDeduction)}</td>
                  <td className="px-4 py-3 text-green-600">{fmt(l.totalPaid)}</td>
                  <td className="px-4 py-3 font-medium text-red-600">{fmt(l.remainingBalance)}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-[150px] truncate">{l.reason || '-'}</td>
                  <td className="px-4 py-3">
                    <StatusBadge color={statusColors[l.status] || 'gray'}>
                      {l.status?.charAt(0).toUpperCase() + l.status?.slice(1)}
                    </StatusBadge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Loan Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add Loan" size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput label="Staff Member *" type="select" name="staff" value={form.staff} onChange={handleChange}>
            <option value="">Select staff</option>
            {staffList.map((s) => (
              <option key={s._id} value={s._id}>
                {s.user?.name || s.employeeId} ({s.employeeId})
              </option>
            ))}
          </FormInput>
          <FormInput label="Loan Amount *" type="number" name="amount" value={form.amount} onChange={handleChange} placeholder="0" min="1" />
          <FormInput label="Monthly Deduction *" type="number" name="monthlyDeduction" value={form.monthlyDeduction} onChange={handleChange} placeholder="0" min="1" />
          <FormInput label="Reason" type="textarea" name="reason" value={form.reason} onChange={handleChange} placeholder="Reason for loan" />
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2.5 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 disabled:opacity-50">
              {saving ? 'Creating...' : 'Add Loan'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default StaffLoans;

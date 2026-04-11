import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import PageHeader from '../../components/PageHeader';
import FormInput from '../../components/FormInput';
import { getLeaveTypes, createLeaveApplication, getLeaveBalance } from '../../services/leave.service';
import { getStaff } from '../../services/hrm.service';
import { useAuth } from '../../context/AuthContext';

const balanceColors = [
  { border: 'border-orange-500', text: 'text-orange-600', bg: 'bg-orange-50' },
  { border: 'border-blue-500', text: 'text-blue-600', bg: 'bg-blue-50' },
  { border: 'border-green-500', text: 'text-green-600', bg: 'bg-green-50' },
  { border: 'border-purple-500', text: 'text-purple-600', bg: 'bg-purple-50' },
  { border: 'border-red-500', text: 'text-red-600', bg: 'bg-red-50' },
  { border: 'border-teal-500', text: 'text-teal-600', bg: 'bg-teal-50' },
];

const ApplyLeave = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [balances, setBalances] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    staff: '',
    leaveType: '',
    startDate: '',
    endDate: '',
    totalDays: '',
    reason: '',
  });

  useEffect(() => {
    getLeaveTypes().then((res) => setLeaveTypes(res.data.data || [])).catch(() => {});
    getStaff({ limit: 200 }).then((res) => setStaffList(res.data.data?.data || res.data.data || [])).catch(() => {});
  }, []);

  // Fetch balance when staff changes
  useEffect(() => {
    if (!form.staff) { setBalances([]); return; }
    getLeaveBalance(form.staff)
      .then((res) => setBalances(res.data.data || []))
      .catch(() => setBalances([]));
  }, [form.staff]);

  // Auto-calculate days
  useEffect(() => {
    if (form.startDate && form.endDate) {
      const start = new Date(form.startDate);
      const end = new Date(form.endDate);
      if (end >= start) {
        const diffTime = end - start;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        setForm((prev) => ({ ...prev, totalDays: String(diffDays) }));
      }
    }
  }, [form.startDate, form.endDate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.staff) return toast.error('Select a staff member');
    if (!form.leaveType) return toast.error('Select a leave type');
    if (!form.startDate || !form.endDate) return toast.error('Select start and end dates');
    if (!form.totalDays || Number(form.totalDays) <= 0) return toast.error('Invalid days');
    if (!form.reason) return toast.error('Enter a reason');

    setSubmitting(true);
    try {
      await createLeaveApplication({
        staff: form.staff,
        leaveType: form.leaveType,
        startDate: form.startDate,
        endDate: form.endDate,
        totalDays: Number(form.totalDays),
        reason: form.reason,
      });
      toast.success('Leave application submitted');
      navigate('/leave/pending');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader title="Apply for Leave" subtitle="Submit a leave application" />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Form */}
        <div className="lg:col-span-3">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <FormInput label="Staff Member *" name="staff" type="select" value={form.staff} onChange={handleChange}>
              <option value="">Select staff</option>
              {staffList.map((s) => (
                <option key={s._id} value={s._id}>{s.user?.name || s.employeeId} ({s.employeeId})</option>
              ))}
            </FormInput>
            <FormInput label="Leave Type *" name="leaveType" type="select" value={form.leaveType} onChange={handleChange}>
              <option value="">Select leave type</option>
              {leaveTypes.map((lt) => (
                <option key={lt._id} value={lt._id}>{lt.name} ({lt.daysAllowed} days)</option>
              ))}
            </FormInput>
            <div className="grid grid-cols-2 gap-4">
              <FormInput label="Start Date *" name="startDate" type="date" value={form.startDate} onChange={handleChange} />
              <FormInput label="End Date *" name="endDate" type="date" value={form.endDate} onChange={handleChange} />
            </div>
            <FormInput label="Number of Days" name="totalDays" type="number" value={form.totalDays} onChange={handleChange} min="1" />
            <FormInput label="Reason *" name="reason" type="textarea" value={form.reason} onChange={handleChange} placeholder="Enter reason for leave" />
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
              <button type="button" onClick={() => navigate(-1)} className="px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">Cancel</button>
              <button type="submit" disabled={submitting} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                {submitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </form>
        </div>

        {/* Leave Balance */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Leave Balance</h3>
            {!form.staff ? (
              <p className="text-sm text-gray-400">Select a staff member to view balance</p>
            ) : balances.length === 0 ? (
              <p className="text-sm text-gray-400">No balance data available</p>
            ) : (
              <div className="space-y-4">
                {balances.map((bal, i) => {
                  const c = balanceColors[i % balanceColors.length];
                  const pct = bal.allowed > 0 ? Math.round((bal.used / bal.allowed) * 100) : 0;
                  return (
                    <div key={bal.leaveType._id || bal.leaveType} className={`${c.bg} rounded-lg p-4`}>
                      <p className="text-sm font-medium text-gray-700 mb-2">{bal.leaveType.name || bal.leaveType}</p>
                      <div className="flex items-center gap-3">
                        <div className={`w-14 h-14 rounded-full border-4 ${c.border} flex items-center justify-center`}>
                          <span className={`text-sm font-bold ${c.text}`}>{bal.used}</span>
                        </div>
                        <div>
                          <p className="text-xl font-bold text-gray-900">
                            {bal.used} <span className="text-gray-400 text-sm font-normal">/ {bal.allowed}</span>
                          </p>
                          <p className="text-xs text-gray-500">{bal.remaining} days remaining</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplyLeave;
